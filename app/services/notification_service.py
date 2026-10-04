"""
Creates in-app notifications for the events Milestone 3 requires:
- an approval is requested from a reviewer
- a reviewer approves or rejects a decision
- someone comments on a decision you own
- someone starts a discussion thread on a decision you own

Notifications are written in the same DB transaction as the action that
triggers them (the caller still needs to db.commit()).
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.services.email_service import send_email


def notify(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(notification)
    db.flush()

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.email_notifications_enabled:
        send_email(
            to_address=user.email,
            subject=title,
            body=message
        )

    return notification
