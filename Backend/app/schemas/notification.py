import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    notification_type: NotificationType
    title: str
    message: str | None
    decision_id: uuid.UUID | None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationList(BaseModel):
    notifications: list[NotificationOut]
    total: int
    unread_count: int


class UnreadCountOut(BaseModel):
    count: int