from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user, require_role
from security.audit import log_action
from security.notifications import notify
from models.decision import Decision, DecisionStatus
from models.approval_step import ApprovalStep, ApprovalStepStatus
from models.user import User
from Schemas.approval import (
    ApprovalWorkflowCreate,
    ApprovalDecisionIn,
    ApprovalEscalateIn,
    ApprovalStepOut,
)

router = APIRouter(prefix="/decisions/{decision_id}/approvals", tags=["Approval Workflow"])


def _get_decision(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.post("", response_model=List[ApprovalStepOut], status_code=201)
def create_approval_workflow(
    decision_id: int,
    payload: ApprovalWorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager", "administrator")),
):
    """Assign an ordered chain of reviewers to a decision. reviewer_ids[0] is
    level 1 and must approve before level 2 becomes actionable, and so on."""
    decision = _get_decision(db, decision_id)

    if decision.status not in (DecisionStatus.draft, DecisionStatus.under_review):
        raise HTTPException(
            status_code=400,
            detail="An approval workflow can only be started for a Draft or Under Review decision",
        )

    existing_pending = (
        db.query(ApprovalStep)
        .filter(ApprovalStep.decision_id == decision_id, ApprovalStep.status == ApprovalStepStatus.pending)
        .count()
    )
    if existing_pending:
        raise HTTPException(
            status_code=400,
            detail="This decision already has an active approval workflow in progress",
        )

    steps = []
    for index, reviewer_id in enumerate(payload.reviewer_ids, start=1):
        reviewer = db.query(User).filter(User.id == reviewer_id).first()
        if not reviewer:
            raise HTTPException(status_code=400, detail=f"No such user: reviewer_id {reviewer_id}")
        step = ApprovalStep(
            decision_id=decision_id,
            level=index,
            reviewer_id=reviewer_id,
            assigned_by_id=current_user.id,
        )
        db.add(step)
        steps.append(step)

    if decision.status == DecisionStatus.draft:
        decision.status = DecisionStatus.under_review
        db.add(decision)

    db.commit()
    for step in steps:
        db.refresh(step)

    log_action(
        db,
        actor=current_user,
        action="decision.approval_workflow_created",
        entity_type="decision",
        entity_id=decision_id,
        details=f"Approval chain of {len(steps)} level(s) assigned for '{decision.title}'",
    )

    first_reviewer = steps[0].reviewer_id
    notify(
        db,
        user_id=first_reviewer,
        message=f"You have been assigned as level 1 reviewer for decision '{decision.title}'",
        entity_type="decision",
        entity_id=decision_id,
    )

    return steps


@router.get("", response_model=List[ApprovalStepOut])
def list_approval_steps(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_decision(db, decision_id)
    return (
        db.query(ApprovalStep)
        .filter(ApprovalStep.decision_id == decision_id)
        .order_by(ApprovalStep.level.asc())
        .all()
    )


@router.post("/{step_id}/decide", response_model=ApprovalStepOut)
def decide_approval_step(
    decision_id: int,
    step_id: int,
    payload: ApprovalDecisionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = _get_decision(db, decision_id)
    step = (
        db.query(ApprovalStep)
        .filter(ApprovalStep.id == step_id, ApprovalStep.decision_id == decision_id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Approval step not found")

    if step.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the assigned reviewer can decide this step")

    if step.status != ApprovalStepStatus.pending:
        raise HTTPException(status_code=400, detail="This step has already been decided")

    earlier_incomplete = (
        db.query(ApprovalStep)
        .filter(
            ApprovalStep.decision_id == decision_id,
            ApprovalStep.level < step.level,
            ApprovalStep.status != ApprovalStepStatus.approved,
        )
        .count()
    )
    if earlier_incomplete:
        raise HTTPException(status_code=400, detail="Earlier approval levels have not been completed yet")

    from datetime import datetime, timezone

    step.comment = payload.comment
    step.decided_at = datetime.now(timezone.utc)

    if payload.decision == "reject":
        step.status = ApprovalStepStatus.rejected
        db.add(step)

        # Any remaining pending steps at later levels are moot now
        (
            db.query(ApprovalStep)
            .filter(
                ApprovalStep.decision_id == decision_id,
                ApprovalStep.level > step.level,
                ApprovalStep.status == ApprovalStepStatus.pending,
            )
            .update({"status": ApprovalStepStatus.skipped})
        )

        decision.status = DecisionStatus.rejected
        db.add(decision)
        db.commit()
        db.refresh(step)

        log_action(
            db,
            actor=current_user,
            action="decision.approval_decided",
            entity_type="decision",
            entity_id=decision_id,
            details=f"Level {step.level} reviewer rejected '{decision.title}'"
            + (f": {payload.comment}" if payload.comment else ""),
        )
        notify(
            db,
            user_id=decision.created_by_id,
            message=f"Your decision '{decision.title}' was rejected at approval level {step.level}",
            entity_type="decision",
            entity_id=decision_id,
        )
        return step

    # approve
    step.status = ApprovalStepStatus.approved
    db.add(step)
    db.commit()
    db.refresh(step)

    log_action(
        db,
        actor=current_user,
        action="decision.approval_decided",
        entity_type="decision",
        entity_id=decision_id,
        details=f"Level {step.level} reviewer approved '{decision.title}'"
        + (f": {payload.comment}" if payload.comment else ""),
    )

    next_step = (
        db.query(ApprovalStep)
        .filter(ApprovalStep.decision_id == decision_id, ApprovalStep.level == step.level + 1)
        .first()
    )
    if next_step:
        notify(
            db,
            user_id=next_step.reviewer_id,
            message=f"You have been assigned as level {next_step.level} reviewer for decision '{decision.title}'",
            entity_type="decision",
            entity_id=decision_id,
        )
    else:
        decision.status = DecisionStatus.approved
        db.add(decision)
        db.commit()

        log_action(
            db,
            actor=current_user,
            action="decision.status_changed",
            entity_type="decision",
            entity_id=decision_id,
            details=f"Status changed to 'Approved' (final approval level {step.level} cleared)",
        )
        notify(
            db,
            user_id=decision.created_by_id,
            message=f"Your decision '{decision.title}' has been fully approved",
            entity_type="decision",
            entity_id=decision_id,
        )

    return step


@router.post("/{step_id}/escalate", response_model=ApprovalStepOut)
def escalate_approval_step(
    decision_id: int,
    step_id: int,
    payload: ApprovalEscalateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager", "administrator")),
):
    """Reassign a still-pending step to a different reviewer — e.g. the
    original reviewer is unresponsive or unavailable."""
    decision = _get_decision(db, decision_id)
    step = (
        db.query(ApprovalStep)
        .filter(ApprovalStep.id == step_id, ApprovalStep.decision_id == decision_id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Approval step not found")
    if step.status != ApprovalStepStatus.pending:
        raise HTTPException(status_code=400, detail="Only a pending step can be escalated")

    new_reviewer = db.query(User).filter(User.id == payload.new_reviewer_id).first()
    if not new_reviewer:
        raise HTTPException(status_code=400, detail="No such user for new_reviewer_id")

    old_reviewer_id = step.reviewer_id
    step.reviewer_id = payload.new_reviewer_id
    db.add(step)
    db.commit()
    db.refresh(step)

    log_action(
        db,
        actor=current_user,
        action="decision.approval_escalated",
        entity_type="decision",
        entity_id=decision_id,
        details=f"Level {step.level} reviewer reassigned from user #{old_reviewer_id} to user #{payload.new_reviewer_id}"
        + (f": {payload.comment}" if payload.comment else ""),
    )
    notify(
        db,
        user_id=payload.new_reviewer_id,
        message=f"You have been assigned as level {step.level} reviewer for decision '{decision.title}' (escalated)",
        entity_type="decision",
        entity_id=decision_id,
    )

    return step
