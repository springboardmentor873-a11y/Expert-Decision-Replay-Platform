from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification, User
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.post(
    "/",
    response_model=NotificationResponse
)
def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == notification_data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    notification = Notification(
        user_id=notification_data.user_id,
        message=notification_data.message,
        notification_type=notification_data.notification_type,
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


@router.get(
    "/",
    response_model=list[NotificationResponse]
)
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(
        Notification.created_at.desc()
    ).all()


@router.put(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification