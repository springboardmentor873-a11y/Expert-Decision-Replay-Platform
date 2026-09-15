from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: int
    message: str
    notification_type: str = "General"


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True