from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: int | None
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True