from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.models.collaboration import Notification
from app.models.identity import User
from app.schemas.collaboration import NotificationCountOut, NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationOut]:
    """List notifications for currently authenticated user."""
    query = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.deleted_at.is_(None),
    )
    if unread_only:
        query = query.where(Notification.read_at.is_(None))

    notifications = db.scalars(
        query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    ).all()
    return [NotificationOut.model_validate(n) for n in notifications]


@router.get("/unread-count", response_model=NotificationCountOut)
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationCountOut:
    """Get the count of unread notifications for top navigation bell."""
    count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.read_at.is_(None),
            Notification.deleted_at.is_(None),
        )
    ) or 0
    return NotificationCountOut(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationOut:
    """Mark a notification as read."""
    n = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
            Notification.deleted_at.is_(None),
        )
    )
    if not n:
        raise NotFoundError(message="Notification not found.")

    if not n.read_at:
        n.read_at = datetime.now(UTC)
        db.commit()
        db.refresh(n)

    return NotificationOut.model_validate(n)


@router.post("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Mark all unread notifications for current user as read."""
    unread = db.scalars(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.read_at.is_(None),
            Notification.deleted_at.is_(None),
        )
    ).all()
    now = datetime.now(UTC)
    for n in unread:
        n.read_at = now
    db.commit()
    return {"status": "ok", "message": f"{len(unread)} notifications marked as read."}
