"""
Business logic for decisions that's reused across multiple routers
(decisions, alternatives, files) — kept here instead of duplicated in
each router.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.decision import Decision, DecisionStatus
from app.models.decision_version import DecisionVersion
from app.models.user import User, UserRole

EDIT_ALLOWED_ROLES = (UserRole.MANAGER, UserRole.ADMINISTRATOR)


async def get_decision_or_404(db: AsyncSession, decision_id: uuid.UUID, with_children: bool = False) -> Decision:
    query = select(Decision).where(Decision.id == decision_id)
    if with_children:
        query = query.options(
            selectinload(Decision.alternatives), selectinload(Decision.attachments)
        )
    result = await db.execute(query)
    decision = result.scalar_one_or_none()
    if decision is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found.")
    return decision


def ensure_can_edit(user: User, decision: Decision) -> None:
    """
    Who can edit a decision (and its alternatives/attachments):
      - the person who created it, OR a Manager/Administrator
      - AND only while it's still in Draft — once submitted for review,
        editing is locked (revisions come back once the approval
        workflow, milestone 4, defines how that should work).
    """
    is_owner_or_privileged = decision.created_by == user.id or user.role in EDIT_ALLOWED_ROLES
    if not is_owner_or_privileged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the decision's creator, a Manager, or an Administrator can edit this.",
        )
    if decision.status != DecisionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This decision is '{decision.status.value}' and can no longer be edited.",
        )


async def record_version(db: AsyncSession, decision: Decision, edited_by: uuid.UUID) -> None:
    """Saves a snapshot of the decision's current editable fields."""
    result = await db.execute(
        select(DecisionVersion.version_number)
        .where(DecisionVersion.decision_id == decision.id)
        .order_by(DecisionVersion.version_number.desc())
        .limit(1)
    )
    last_version = result.scalar_one_or_none() or 0

    db.add(
        DecisionVersion(
            decision_id=decision.id,
            version_number=last_version + 1,
            title=decision.title,
            problem_statement=decision.problem_statement,
            category=decision.category,
            edited_by=edited_by,
        )
    )


async def submit_for_review(db: AsyncSession, decision: Decision, user: User) -> Decision:
    ensure_can_edit(decision=decision, user=user)  # must still be Draft + owner/privileged

    if not decision.title.strip() or not decision.problem_statement.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A title and problem statement are required before submitting for review.",
        )

    decision.status = DecisionStatus.UNDER_REVIEW
    await db.commit()
    await db.refresh(decision)
    return decision
