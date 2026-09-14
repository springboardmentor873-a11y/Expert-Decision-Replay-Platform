from uuid import UUID as UUIDType

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationList, NotificationOut, UnreadCountOut
from app.services.notification_service import (
    count_for_user,
    list_for_user,
    mark_all_read,
    mark_read,
    unread_count_for_user,
)

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("", response_model=NotificationList)
async def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = await list_for_user(db, current_user, limit=limit, offset=offset)
    return NotificationList(
        notifications=notifications,
        total=await count_for_user(db, current_user),
        unread_count=await unread_count_for_user(db, current_user),
    )


@router.get("/unread-count", response_model=UnreadCountOut)
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UnreadCountOut(count=await unread_count_for_user(db, current_user))


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: UUIDType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mark_read(db, current_user, notification_id)


@router.post("/read-all", response_model=UnreadCountOut)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UnreadCountOut(count=await mark_all_read(db, current_user))