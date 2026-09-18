from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.approval import Approval, ApprovalActionEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.services.decision_service import get_decision_by_id
from app.services.decision_version_service import create_version_snapshot

REVIEW_CAPABLE_ROLES = (
    RoleEnum.REVIEWER.value,
    RoleEnum.MANAGER.value,
    RoleEnum.ADMINISTRATOR.value,
)


def validate_approval_permission(current_user: User) -> None:
    """Enforces that only Reviewer, Manager, or Administrator can perform approval actions."""
    user_role = current_user.role.name if current_user.role else ""
    if user_role not in REVIEW_CAPABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Access requires Reviewer, Manager, or Administrator role."
        )


def validate_decision_reviewable(decision: Decision) -> None:
    """Verifies that a decision is in an active reviewable status (Submitted or Under Review)."""
    if decision.status == DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review a draft decision. It must be submitted first."
        )
    if decision.status == DecisionStatusEnum.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision is already Approved."
        )
    if decision.status == DecisionStatusEnum.REJECTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision is already Rejected."
        )


def validate_not_self_action(decision: Decision, current_user: User, action_name: str = "approve") -> None:
    """Prevents decision authors from approving or rejecting their own decisions."""
    if decision.created_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You cannot {action_name} your own decision."
        )


def get_pending_approvals(
    db: Session,
    current_user: User,
    skip: int = 0,
    limit: int = 100
) -> List[Decision]:
    """
    Returns decisions currently waiting for review/approval (Submitted or Under Review).
    Restricted to Reviewers, Managers, and Administrators.
    """
    validate_approval_permission(current_user)

    reviewable_statuses = [
        DecisionStatusEnum.SUBMITTED.value,
        DecisionStatusEnum.UNDER_REVIEW.value,
    ]

    return (
        db.query(Decision)
        .filter(Decision.status.in_(reviewable_statuses))
        .order_by(Decision.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def approve_decision(
    db: Session,
    decision_id: int,
    current_user: User,
    comment: Optional[str] = None
) -> Approval:
    """
    Approves a submitted decision:
    1. Validates reviewer role.
    2. Ensures decision exists and is reviewable.
    3. Prevents self-approval.
    4. Updates decision status to Approved.
    5. Creates Approval history record.
    6. Creates Version Tracking snapshot ("Decision approved").
    7. Fully transactional.
    """
    validate_approval_permission(current_user)

    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    validate_decision_reviewable(decision)
    validate_not_self_action(decision, current_user, "approve")

    previous_status = decision.status

    try:
        # Update Decision status
        decision.status = DecisionStatusEnum.APPROVED.value

        # Create Approval audit record
        approval = Approval(
            decision_id=decision.id,
            reviewer_id=current_user.id,
            action=ApprovalActionEnum.APPROVED.value,
            previous_status=previous_status,
            new_status=DecisionStatusEnum.APPROVED.value,
            rejection_reason=None,
            comment=comment.strip() if comment else None,
        )
        db.add(approval)

        # Create Version Tracking entry for status change
        create_version_snapshot(
            db=db,
            decision=decision,
            changed_by=current_user.id,
            change_summary="Decision approved",
        )

        # Notify decision owner of approval
        from app.services.notification_service import notify_decision_approved
        notify_decision_approved(db=db, decision=decision, actor=current_user, comment=comment)

        # Audit logging for decision approval
        from app.models.audit_log import AuditActionEnum
        from app.services.audit_service import create_audit_log
        create_audit_log(
            db=db,
            action=AuditActionEnum.DECISION_APPROVED,
            entity_type="Decision",
            entity_id=decision.id,
            user_id=current_user.id,
            description=f"Approved decision \"{decision.title}\"",
            details={
                "decision_id": decision.id,
                "title": decision.title,
                "reviewer_id": current_user.id,
                "previous_status": previous_status,
                "comment": comment.strip() if comment else None,
            },
            skip_commit=True,
        )

        db.commit()
        db.refresh(approval)
        db.refresh(decision)
        return approval

    except Exception:
        db.rollback()
        raise


def reject_decision(
    db: Session,
    decision_id: int,
    current_user: User,
    reason: str,
    comment: Optional[str] = None
) -> Approval:
    """
    Rejects a submitted decision:
    1. Validates reviewer role.
    2. Validates rejection reason is non-empty.
    3. Ensures decision exists and is reviewable.
    4. Prevents self-rejection.
    5. Updates decision status to Rejected.
    6. Creates Approval history record with required rejection reason.
    7. Creates Version Tracking snapshot ("Decision rejected").
    8. Fully transactional.
    """
    validate_approval_permission(current_user)

    if not reason or not reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required and cannot be empty."
        )
    if len(reason.strip()) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason cannot exceed 2000 characters."
        )

    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    validate_decision_reviewable(decision)
    validate_not_self_action(decision, current_user, "reject")

    previous_status = decision.status

    try:
        # Update Decision status
        decision.status = DecisionStatusEnum.REJECTED.value

        # Create Approval audit record
        approval = Approval(
            decision_id=decision.id,
            reviewer_id=current_user.id,
            action=ApprovalActionEnum.REJECTED.value,
            previous_status=previous_status,
            new_status=DecisionStatusEnum.REJECTED.value,
            rejection_reason=reason.strip(),
            comment=comment.strip() if comment else None,
        )
        db.add(approval)

        # Create Version Tracking entry for status change
        create_version_snapshot(
            db=db,
            decision=decision,
            changed_by=current_user.id,
            change_summary="Decision rejected",
        )

        # Notify decision owner of rejection
        from app.services.notification_service import notify_decision_rejected
        notify_decision_rejected(db=db, decision=decision, actor=current_user, reason=reason, comment=comment)

        # Audit logging for decision rejection
        from app.models.audit_log import AuditActionEnum
        from app.services.audit_service import create_audit_log
        create_audit_log(
            db=db,
            action=AuditActionEnum.DECISION_REJECTED,
            entity_type="Decision",
            entity_id=decision.id,
            user_id=current_user.id,
            description=f"Rejected decision \"{decision.title}\" (Reason: {reason.strip()})",
            details={
                "decision_id": decision.id,
                "title": decision.title,
                "reviewer_id": current_user.id,
                "previous_status": previous_status,
                "reason": reason.strip(),
                "comment": comment.strip() if comment else None,
            },
            skip_commit=True,
        )

        db.commit()
        db.refresh(approval)
        db.refresh(decision)
        return approval

    except Exception:
        db.rollback()
        raise


def get_approval_history(
    db: Session,
    decision_id: int,
    current_user: User
) -> List[Approval]:
    """
    Returns chronological approval and rejection history for a decision.
    User must have authorization to view the parent decision.
    """
    # Enforces decision existence and visibility authorization
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    return (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.created_at.desc())
        .all()
    )
