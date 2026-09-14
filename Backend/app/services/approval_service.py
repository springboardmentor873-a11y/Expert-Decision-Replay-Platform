"""
Approval workflow business logic.

Handles the transition of decisions through the review pipeline:
  DRAFT → UNDER_REVIEW (submit) → PENDING_MANAGER_REVIEW (reviewer approve)
  → APPROVED (manager approve) or REJECTED (manager reject or reviewer reject).

All approval actions are recorded in the Approval table.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.decision import Decision, DecisionStatus
from app.models.approval import Approval, ApprovalAction, ApprovalStage
from app.models.user import User, UserRole
from app.services.audit_service import (
    record_manager_approved,
    record_manager_rejected,
    record_reviewer_approved,
    record_reviewer_rejected,
)
from app.services.notification_service import (
    notify_manager_approved,
    notify_manager_rejected,
    notify_reviewer_approved,
    notify_reviewer_rejected,
)


async def get_pending_for_user(
    db: AsyncSession, user: User
) -> list[Decision]:
    """Return decisions awaiting the current user's approval."""
    if user.role == UserRole.REVIEWER:
        result = await db.execute(
            select(Decision)
            .where(Decision.status == DecisionStatus.UNDER_REVIEW)
            .order_by(Decision.created_at.desc())
        )
    elif user.role in (UserRole.MANAGER, UserRole.ADMINISTRATOR):
        result = await db.execute(
            select(Decision)
            .where(Decision.status == DecisionStatus.PENDING_MANAGER_REVIEW)
            .order_by(Decision.created_at.desc())
        )
    else:
        return []
    return result.scalars().all()


async def approve_decision(
    db: AsyncSession, decision: Decision, user: User
) -> Decision:
    """
    Reviewer or Manager approves a decision.
    Reviewer approval moves it to PENDING_MANAGER_REVIEW.
    Manager approval moves it to APPROVED.
    """
    if user.role not in (UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMINISTRATOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Reviewers and Managers can approve decisions.",
        )

    if decision.status == DecisionStatus.UNDER_REVIEW:
        if user.role not in (UserRole.REVIEWER, UserRole.ADMINISTRATOR):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Reviewers can approve at this stage.",
            )
        decision.status = DecisionStatus.PENDING_MANAGER_REVIEW
        approval_stage = ApprovalStage.REVIEWER
    elif decision.status == DecisionStatus.PENDING_MANAGER_REVIEW:
        if user.role not in (UserRole.MANAGER, UserRole.ADMINISTRATOR):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Managers can approve at this stage.",
            )
        decision.status = DecisionStatus.APPROVED
        approval_stage = ApprovalStage.MANAGER
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve a decision with status '{decision.status.value}'.",
        )

    db.add(
        Approval(
            decision_id=decision.id,
            user_id=user.id,
            action=ApprovalAction.APPROVE,
            approval_stage=approval_stage,
        )
    )

    if approval_stage == ApprovalStage.REVIEWER:
        await record_reviewer_approved(db, decision, user)
        await notify_reviewer_approved(db, decision, user)
    else:
        await record_manager_approved(db, decision, user)
        await notify_manager_approved(db, decision, user)

    await db.commit()
    await db.refresh(decision)
    return decision


async def reject_decision(
    db: AsyncSession, decision: Decision, user: User, reason: str
) -> Decision:
    """
    Reviewer or Manager rejects a decision.
    Reviewer rejection sends it back to DRAFT.
    Manager rejection sets it to REJECTED.
    """
    if user.role not in (UserRole.REVIEWER, UserRole.MANAGER, UserRole.ADMINISTRATOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Reviewers and Managers can reject decisions.",
        )

    if not reason or not reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A reason is required when rejecting a decision.",
        )

    if decision.status == DecisionStatus.UNDER_REVIEW:
        if user.role not in (UserRole.REVIEWER, UserRole.ADMINISTRATOR):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Reviewers can reject at this stage.",
            )
        decision.status = DecisionStatus.DRAFT
        approval_stage = ApprovalStage.REVIEWER
    elif decision.status == DecisionStatus.PENDING_MANAGER_REVIEW:
        if user.role not in (UserRole.MANAGER, UserRole.ADMINISTRATOR):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Managers can reject at this stage.",
            )
        decision.status = DecisionStatus.REJECTED
        approval_stage = ApprovalStage.MANAGER
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reject a decision with status '{decision.status.value}'.",
        )

    db.add(
        Approval(
            decision_id=decision.id,
            user_id=user.id,
            action=ApprovalAction.REJECT,
            approval_stage=approval_stage,
            reason=reason.strip(),
        )
    )

    if approval_stage == ApprovalStage.REVIEWER:
        await record_reviewer_rejected(db, decision, user, reason.strip())
        await notify_reviewer_rejected(db, decision, user, reason.strip())
    else:
        await record_manager_rejected(db, decision, user, reason.strip())
        await notify_manager_rejected(db, decision, user, reason.strip())

    await db.commit()
    await db.refresh(decision)
    return decision


async def get_approval_history(
    db: AsyncSession, decision_id: uuid.UUID
) -> list[Approval]:
    """Return all approval actions for a decision, ordered by creation time."""
    result = await db.execute(
        select(Approval)
        .where(Approval.decision_id == decision_id)
        .order_by(Approval.created_at.asc())
    )
    return result.scalars().all()
