from uuid import UUID
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.collaboration import Notification
from app.models.identity import Role, User


def create_notification(
    db: Session,
    user_id: UUID,
    type: str,
    title: str,
    body: str | None = None,
    decision_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> Notification:
    """Create an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        decision_id=decision_id,
        type=type,
        title=title,
        body=body,
        payload=payload or {},
    )
    db.add(notif)
    db.flush()
    return notif


def notify_users_with_role(
    db: Session,
    role_codes: list[str],
    type: str,
    title: str,
    body: str | None = None,
    decision_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
    exclude_user_id: UUID | None = None,
) -> list[Notification]:
    """Send notification to all active users having any of the specified roles."""
    query = (
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(
            Role.code.in_(role_codes),
            User.is_active == True,
            User.deleted_at.is_(None),
        )
    )
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)

    users = db.scalars(query).all()
    created = []
    for u in users:
        n = create_notification(
            db=db,
            user_id=u.id,
            type=type,
            title=title,
            body=body,
            decision_id=decision_id,
            payload=payload,
        )
        created.append(n)
    return created
