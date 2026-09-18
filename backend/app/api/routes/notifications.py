from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.notification import (
    MarkReadResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import (
    get_notification_by_id,
    get_unread_count,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)

router = APIRouter()


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="Get authenticated user's notifications",
)
def list_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns paginated notifications strictly belonging to the calling authenticated user.
    """
    return get_user_notifications(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        unread_only=unread_only,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get count of unread notifications",
)
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the total unread notification count for the authenticated user.
    """
    count = get_unread_count(db=db, current_user=current_user)
    return {"unread_count": count}


@router.patch(
    "/read-all",
    response_model=MarkReadResponse,
    summary="Mark all user notifications as read",
)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks all unread notifications of the current authenticated user as read.
    """
    updated = mark_all_notifications_read(db=db, current_user=current_user)
    return {"message": "All notifications marked as read.", "updated_count": updated}


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a single notification as read",
)
def mark_single_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks one notification as read. Enforces that only the recipient can perform this.
    """
    return mark_notification_read(db=db, notification_id=notification_id, current_user=current_user)


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
    summary="Get a single notification",
)
def get_single_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves a single notification. Accessible strictly to its recipient.
    """
    return get_notification_by_id(db=db, notification_id=notification_id, current_user=current_user)
