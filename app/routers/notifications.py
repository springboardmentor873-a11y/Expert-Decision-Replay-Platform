from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCountResponse, NotificationResponse


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get(
    "",
    response_model=List[NotificationResponse]
)
def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    return (
        query
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get(
    "/unread-count",
    response_model=NotificationCountResponse
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    return {"unread_count": count}


def _get_owned_notification_or_404(db: Session, notification_id: int, user: User) -> Notification:
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    if notification.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another user's notifications",
        )

    return notification


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = _get_owned_notification_or_404(db, notification_id, current_user)
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.patch(
    "/read-all"
)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update({"is_read": True})
    )
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete(
    "/{notification_id}"
)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = _get_owned_notification_or_404(db, notification_id, current_user)
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}
