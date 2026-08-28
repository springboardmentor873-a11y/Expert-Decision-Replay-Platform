from datetime import datetime, UTC
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.collaboration import Approval, ApprovalStep, ApprovalWorkflow
from app.models.decision import Alternative, Decision
from app.models.identity import Role, User
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification, notify_users_with_role
from app.services.version_service import create_decision_snapshot


def get_default_or_first_workflow(db: Session) -> ApprovalWorkflow | None:
    """Find default approval workflow or the first active one."""
    wf = db.scalar(
        select(ApprovalWorkflow).where(ApprovalWorkflow.is_default == True, ApprovalWorkflow.deleted_at.is_(None))
    )
    if not wf:
        wf = db.scalar(select(ApprovalWorkflow).where(ApprovalWorkflow.deleted_at.is_(None)))
    return wf


def ensure_default_workflow_exists(db: Session) -> ApprovalWorkflow:
    """Ensure standard 2-step workflow (Reviewer -> Manager) exists in DB."""
    wf = get_default_or_first_workflow(db)
    if wf:
        return wf

    reviewer_role = db.scalar(select(Role).where(Role.code == "reviewer"))
    manager_role = db.scalar(select(Role).where(Role.code == "manager"))

    wf = ApprovalWorkflow(
        name="Standard Two-Tier Review & Management Approval",
        description="Standard enterprise workflow: Peer Reviewer verification followed by Department Manager authorization.",
        is_default=True,
    )
    db.add(wf)
    db.flush()

    if reviewer_role:
        step1 = ApprovalStep(
            workflow_id=wf.id,
            step_order=1,
            name="Peer & Technical Review",
            required_role_id=reviewer_role.id,
        )
        db.add(step1)

    if manager_role:
        step2 = ApprovalStep(
            workflow_id=wf.id,
            step_order=2,
            name="Management & Executive Sign-off",
            required_role_id=manager_role.id,
        )
        db.add(step2)

    db.flush()
    return wf


def submit_decision_for_review(db: Session, decision_id: UUID, current_user: User) -> Decision:
    """Submit a draft or changes_requested decision into the approval pipeline."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    is_admin = user_role and user_role.code == "administrator"
    if decision.owner_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the decision owner or administrator can submit for review.",
        )

    if decision.status not in ("draft", "changes_requested"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit decision currently in '{decision.status}' status.",
        )

    # Validate decision has at least 1 alternative
    alt_count = db.scalar(
        select(Alternative).where(Alternative.decision_id == decision_id, Alternative.deleted_at.is_(None))
    )
    if not alt_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must contain at least one proposed alternative before submission.",
        )

    wf = ensure_default_workflow_exists(db)
    decision.approval_workflow_id = wf.id
    decision.status = "in_review"

    # Clean existing pending/waiting approval steps
    existing_approvals = db.scalars(select(Approval).where(Approval.decision_id == decision_id)).all()
    for a in existing_approvals:
        db.delete(a)
    db.flush()

    # Create new approval steps based on workflow
    steps = db.scalars(
        select(ApprovalStep).where(ApprovalStep.workflow_id == wf.id).order_by(ApprovalStep.step_order)
    ).all()

    for idx, s in enumerate(steps):
        appr_status = "pending" if idx == 0 else "waiting"
        appr = Approval(
            decision_id=decision_id,
            approval_step_id=s.id,
            step_order=s.step_order,
            step_name=s.name,
            required_role_id=s.required_role_id,
            status=appr_status,
        )
        db.add(appr)

    db.flush()

    create_decision_snapshot(db, decision_id, current_user.id, reason="Submitted for review")
    log_audit(
        db=db,
        action="decision_submit_for_review",
        entity_type="decision",
        entity_id=decision_id,
        actor_id=current_user.id,
        decision_id=decision_id,
    )

    # Notify Reviewers
    notify_users_with_role(
        db=db,
        role_codes=["reviewer", "administrator"],
        type="decision_submitted",
        title="Decision Submitted for Review",
        body=f"Decision '{decision.title}' has been submitted for peer review.",
        decision_id=decision_id,
        exclude_user_id=current_user.id,
    )

    return decision


def approve_decision_step(
    db: Session,
    decision_id: UUID,
    current_user: User,
    comment: str | None = None,
) -> Decision:
    """Approve the current active step in the decision approval pipeline."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    role_code = user_role.code if user_role else ""

    # Find the current pending step
    pending_step = db.scalar(
        select(Approval)
        .where(Approval.decision_id == decision_id, Approval.status == "pending")
        .order_by(Approval.step_order)
    )

    if not pending_step:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending approval step found for this decision.",
        )

    # Verify user has required role
    req_role = db.scalar(select(Role).where(Role.id == pending_step.required_role_id))
    if role_code != "administrator" and (not req_role or req_role.code != role_code):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This approval step requires the '{req_role.name if req_role else 'higher'}' role.",
        )

    # Mark current step as approved
    now = datetime.now(UTC)
    pending_step.status = "approved"
    pending_step.actor_id = current_user.id
    pending_step.acted_at = now
    pending_step.comment = comment

    # Check for next step
    next_step = db.scalar(
        select(Approval)
        .where(Approval.decision_id == decision_id, Approval.status == "waiting")
        .order_by(Approval.step_order)
    )

    if next_step:
        # Move to next tier (e.g. In Review -> In Approval)
        next_step.status = "pending"
        decision.status = "in_approval"

        create_decision_snapshot(
            db, decision_id, current_user.id, reason=f"Step '{pending_step.step_name}' approved by {role_code}"
        )
        log_audit(
            db=db,
            action="approval_step_approved",
            entity_type="approval",
            entity_id=pending_step.id,
            actor_id=current_user.id,
            decision_id=decision_id,
            extra={"step_order": pending_step.step_order, "comment": comment},
        )

        # Notify Managers
        notify_users_with_role(
            db=db,
            role_codes=["manager", "administrator"],
            type="approval_pending_manager",
            title="Management Approval Required",
            body=f"Decision '{decision.title}' passed peer review and is awaiting management sign-off.",
            decision_id=decision_id,
        )
    else:
        # Final approval achieved
        decision.status = "approved"
        decision.implementation_status = "in_progress"

        create_decision_snapshot(db, decision_id, current_user.id, reason="Final decision approval granted")
        log_audit(
            db=db,
            action="decision_approved",
            entity_type="decision",
            entity_id=decision_id,
            actor_id=current_user.id,
            decision_id=decision_id,
            extra={"comment": comment},
        )

        # Notify Decision Owner
        create_notification(
            db=db,
            user_id=decision.owner_id,
            type="decision_approved",
            title="Decision Approved",
            body=f"Your decision '{decision.title}' has received final approval.",
            decision_id=decision_id,
        )

    return decision


def reject_decision(
    db: Session,
    decision_id: UUID,
    current_user: User,
    comment: str | None = None,
) -> Decision:
    """Reject a decision in the approval workflow."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    if decision.status not in ("in_review", "in_approval"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject decision in '{decision.status}' status.",
        )

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    role_code = user_role.code if user_role else ""
    if role_code not in ("reviewer", "manager", "administrator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only designated reviewers, managers, or administrators can reject decisions.",
        )

    pending_step = db.scalar(
        select(Approval).where(Approval.decision_id == decision_id, Approval.status == "pending")
    )
    if pending_step:
        pending_step.status = "rejected"
        pending_step.actor_id = current_user.id
        pending_step.acted_at = datetime.now(UTC)
        pending_step.comment = comment

    decision.status = "rejected"
    decision.implementation_status = "cancelled"

    create_decision_snapshot(db, decision_id, current_user.id, reason="Decision rejected")
    log_audit(
        db=db,
        action="decision_rejected",
        entity_type="decision",
        entity_id=decision_id,
        actor_id=current_user.id,
        decision_id=decision_id,
        extra={"comment": comment},
    )

    create_notification(
        db=db,
        user_id=decision.owner_id,
        type="decision_rejected",
        title="Decision Rejected",
        body=f"Your decision '{decision.title}' was rejected. Comment: {comment or 'None'}",
        decision_id=decision_id,
    )

    return decision


def request_decision_changes(
    db: Session,
    decision_id: UUID,
    current_user: User,
    comment: str | None = None,
) -> Decision:
    """Request modifications/changes on a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    if decision.status not in ("in_review", "in_approval"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request changes on decision in '{decision.status}' status.",
        )

    user_role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    role_code = user_role.code if user_role else ""
    if role_code not in ("reviewer", "manager", "administrator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only designated reviewers, managers, or administrators can request changes.",
        )

    pending_step = db.scalar(
        select(Approval).where(Approval.decision_id == decision_id, Approval.status == "pending")
    )
    if pending_step:
        pending_step.status = "changes_requested"
        pending_step.actor_id = current_user.id
        pending_step.acted_at = datetime.now(UTC)
        pending_step.comment = comment

    decision.status = "changes_requested"

    create_decision_snapshot(db, decision_id, current_user.id, reason="Changes requested")
    log_audit(
        db=db,
        action="decision_changes_requested",
        entity_type="decision",
        entity_id=decision_id,
        actor_id=current_user.id,
        decision_id=decision_id,
        extra={"comment": comment},
    )

    create_notification(
        db=db,
        user_id=decision.owner_id,
        type="decision_changes_requested",
        title="Changes Requested on Decision",
        body=f"Feedback on '{decision.title}': {comment or 'Please review notes and update.'}",
        decision_id=decision_id,
    )

    return decision
