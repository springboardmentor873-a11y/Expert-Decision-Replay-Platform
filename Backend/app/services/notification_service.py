"""
Notification business logic.

Notifications are created as side effects of the approval workflow:
  - a decision is submitted for review              → reviewers are notified
  - a reviewer approves                            → managers are notified,
                                                    and the owner is notified
  - a manager approves                            → the owner is notified
  - a reviewer/manager rejects                     → the owner is notified

Helper functions here only add Notification rows to the session — the caller's
existing commit persists them alongside the state change, keeping workflow
transitions atomic.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decision import Decision
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole


async def _recipient_ids(
    db: AsyncSession, *, roles: tuple[UserRole, ...]
) -> list[uuid.UUID]:
    result = await db.execute(
        select(User.id).where(User.role.in_(roles), User.is_active.is_(True))
    )
    return list(result.scalars().all())


def _add_notification(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    notification_type: NotificationType,
    title: str,
    message: str | None,
    decision_id: uuid.UUID | None = None,
) -> None:
    db.add(
        Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            decision_id=decision_id,
        )
    )


async def notify_submitted_for_review(
    db: AsyncSession, decision: Decision, submitted_by: User
) -> None:
    """A decision just moved to UNDER_REVIEW — reviewers should take a look."""
    for user_id in await _recipient_ids(db, roles=(UserRole.REVIEWER,)):
        _add_notification(
            db,
            user_id=user_id,
            notification_type=NotificationType.APPROVAL_REQUESTED,
            title="Decision awaiting review",
            message=f"'{decision.title}' was submitted for review by {submitted_by.full_name}.",
            decision_id=decision.id,
        )


async def notify_reviewer_approved(
    db: AsyncSession, decision: Decision, actor: User
) -> None:
    """Reviewer approved — managers need to sign off, and the owner should know."""
    for user_id in await _recipient_ids(
        db, roles=(UserRole.MANAGER, UserRole.ADMINISTRATOR)
    ):
        _add_notification(
            db,
            user_id=user_id,
            notification_type=NotificationType.APPROVAL_REQUESTED,
            title="Manager approval needed",
            message=f"'{decision.title}' passed reviewer approval and needs your sign-off.",
            decision_id=decision.id,
        )

    if decision.created_by != actor.id:
        _add_notification(
            db,
            user_id=decision.created_by,
            notification_type=NotificationType.APPROVAL_MOVED,
            title="Review approved",
            message=f"'{decision.title}' was approved by {actor.full_name} and now awaits manager approval.",
            decision_id=decision.id,
        )


async def notify_manager_approved(
    db: AsyncSession, decision: Decision, actor: User
) -> None:
    """Manager approved — the decision is done and the owner should know."""
    if decision.created_by != actor.id:
        _add_notification(
            db,
            user_id=decision.created_by,
            notification_type=NotificationType.DECISION_APPROVED,
            title="Decision approved",
            message=f"'{decision.title}' was approved by {actor.full_name}.",
            decision_id=decision.id,
        )


async def notify_reviewer_rejected(
    db: AsyncSession, decision: Decision, actor: User, reason: str
) -> None:
    """Reviewer sent it back to draft — the owner needs to revise."""
    if decision.created_by != actor.id:
        _add_notification(
            db,
            user_id=decision.created_by,
            notification_type=NotificationType.RETURNED_FOR_REVISION,
            title="Decision returned for revision",
            message=(
                f"'{decision.title}' was returned to draft by {actor.full_name}."
                f" Reason: {reason}"
            ),
            decision_id=decision.id,
        )


async def notify_manager_rejected(
    db: AsyncSession, decision: Decision, actor: User, reason: str
) -> None:
    """Manager rejected the decision outright — the owner should know."""
    if decision.created_by != actor.id:
        _add_notification(
            db,
            user_id=decision.created_by,
            notification_type=NotificationType.DECISION_REJECTED,
            title="Decision rejected",
            message=f"'{decision.title}' was rejected by {actor.full_name}. Reason: {reason}",
            decision_id=decision.id,
        )


async def list_for_user(
    db: AsyncSession, user: User, *, limit: int = 20, offset: int = 0
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def count_for_user(db: AsyncSession, user: User) -> int:
    result = await db.execute(
        select(func.count()).select_from(Notification).where(Notification.user_id == user.id)
    )
    return result.scalar_one()


async def unread_count_for_user(db: AsyncSession, user: User) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
    )
    return result.scalar_one()


async def mark_read(db: AsyncSession, user: User, notification_id: uuid.UUID) -> Notification:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user.id
        )
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found."
        )
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


async def mark_all_read(db: AsyncSession, user: User) -> int:
    """Marks every unread notification for the user as read; returns rows changed."""
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id, Notification.is_read.is_(False))
    )
    notifications = result.scalars().all()
    for notification in notifications:
        notification.is_read = True
    await db.commit()
    return len(notifications)