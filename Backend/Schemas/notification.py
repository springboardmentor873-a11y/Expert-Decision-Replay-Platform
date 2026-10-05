from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient_user_id: int
    decision_id: Optional[int] = None
    message: str
    is_read: bool
    created_at: datetime
