from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.collaboration import Approval, ApprovalStep, ApprovalWorkflow
from app.models.decision import Decision
from app.models.identity import Role, User, UserProfile
from app.schemas.approval import (
    ApprovalActionRequest,
    ApprovalHistoryOut,
    ApprovalOut,
    ApprovalStepOut,
    ApprovalWorkflowOut,
)
from app.schemas.decision import DecisionOut
from app.services.approval_service import (
    approve_decision_step,
    ensure_default_workflow_exists,
    reject_decision,
    request_decision_changes,
    submit_decision_for_review,
)
from app.services.decision_service import build_decision_out

router = APIRouter(tags=["approvals & workflows"])


@router.get("/approvals/workflows", response_model=list[ApprovalWorkflowOut])
def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ApprovalWorkflowOut]:
    """List available approval workflows with steps."""
    ensure_default_workflow_exists(db)
    wfs = db.scalars(select(ApprovalWorkflow).where(ApprovalWorkflow.deleted_at.is_(None))).all()
    results = []
    for wf in wfs:
        steps = db.scalars(
            select(ApprovalStep).where(ApprovalStep.workflow_id == wf.id).order_by(ApprovalStep.step_order)
        ).all()
        s_outs = []
        for s in steps:
            r = db.scalar(select(Role).where(Role.id == s.required_role_id))
            s_outs.append(
                ApprovalStepOut(
                    id=s.id,
                    workflow_id=s.workflow_id,
                    step_order=s.step_order,
                    name=s.name,
                    required_role_id=s.required_role_id,
                    required_role_code=r.code if r else None,
                )
            )
        results.append(
            ApprovalWorkflowOut(
                id=wf.id,
                name=wf.name,
                description=wf.description,
                is_default=wf.is_default,
                steps=s_outs,
            )
        )
    return results


@router.post("/decisions/{decision_id}/submit", response_model=ApprovalHistoryOut)
def submit_for_review(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApprovalHistoryOut:
    """Submit a draft decision for peer review."""
    decision = submit_decision_for_review(db, decision_id, current_user)
    db.commit()
    return get_decision_approval_history(decision_id, current_user, db)


@router.post("/decisions/{decision_id}/approve", response_model=ApprovalHistoryOut)
def approve_step(
    decision_id: UUID,
    data: ApprovalActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApprovalHistoryOut:
    """Approve current pending workflow step."""
    decision = approve_decision_step(db, decision_id, current_user, comment=data.comment)
    db.commit()
    return get_decision_approval_history(decision_id, current_user, db)


@router.post("/decisions/{decision_id}/reject", response_model=ApprovalHistoryOut)
def reject_step(
    decision_id: UUID,
    data: ApprovalActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApprovalHistoryOut:
    """Reject a decision in the approval workflow."""
    decision = reject_decision(db, decision_id, current_user, comment=data.comment)
    db.commit()
    return get_decision_approval_history(decision_id, current_user, db)


@router.post("/decisions/{decision_id}/request-changes", response_model=ApprovalHistoryOut)
def request_changes_step(
    decision_id: UUID,
    data: ApprovalActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApprovalHistoryOut:
    """Request changes on a decision in the approval workflow."""
    decision = request_decision_changes(db, decision_id, current_user, comment=data.comment)
    db.commit()
    return get_decision_approval_history(decision_id, current_user, db)


@router.get("/decisions/{decision_id}/approvals", response_model=ApprovalHistoryOut)
def get_decision_approval_history(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApprovalHistoryOut:
    """Get the full approval timeline and signatures for a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    approvals = db.scalars(
        select(Approval).where(Approval.decision_id == decision_id).order_by(Approval.step_order)
    ).all()

    steps_out = []
    for ap in approvals:
        role = db.scalar(select(Role).where(Role.id == ap.required_role_id))
        actor = db.scalar(select(User).where(User.id == ap.actor_id)) if ap.actor_id else None
        actor_prof = db.scalar(select(UserProfile).where(UserProfile.user_id == ap.actor_id)) if ap.actor_id else None
        actor_name = actor_prof.full_name if actor_prof else (actor.email if actor else None)

        steps_out.append(
            ApprovalOut(
                id=ap.id,
                decision_id=ap.decision_id,
                approval_step_id=ap.approval_step_id,
                step_order=ap.step_order,
                step_name=ap.step_name,
                required_role_id=ap.required_role_id,
                required_role_code=role.code if role else None,
                assignee_id=ap.assignee_id,
                actor_id=ap.actor_id,
                actor_name=actor_name,
                actor_email=actor.email if actor else None,
                status=ap.status,
                comment=ap.comment,
                acted_at=ap.acted_at,
                created_at=ap.created_at,
            )
        )

    return ApprovalHistoryOut(
        decision_id=decision.id,
        current_status=decision.status,
        steps=steps_out,
    )


@router.get("/approvals/pending", response_model=list[DecisionOut])
def get_pending_approvals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DecisionOut]:
    """Get decisions pending approval for the current user's role."""
    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    role_code = user_role.code if user_role else "employee"

    if role_code == "administrator":
        query = (
            select(Decision)
            .join(Approval, Approval.decision_id == Decision.id)
            .where(Approval.status == "pending", Decision.deleted_at.is_(None))
            .distinct()
        )
    else:
        query = (
            select(Decision)
            .join(Approval, Approval.decision_id == Decision.id)
            .where(
                Approval.required_role_id == current_user.role_id,
                Approval.status == "pending",
                Decision.deleted_at.is_(None),
            )
            .distinct()
        )

    decisions = db.scalars(query.order_by(Decision.created_at.desc())).all()
    return [build_decision_out(db, d) for d in decisions]
