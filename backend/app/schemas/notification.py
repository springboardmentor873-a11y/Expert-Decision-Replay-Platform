from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.notification import NotificationTypeEnum


class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    notification_type: str
    title: str
    message: str
    decision_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    action_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int
    unread_count: int


class MarkReadResponse(BaseModel):
    message: str
    updated_count: int = 1
