from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int
    decision_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    created_at: datetime
