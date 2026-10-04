from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    notification_type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCountResponse(BaseModel):
    unread_count: int
