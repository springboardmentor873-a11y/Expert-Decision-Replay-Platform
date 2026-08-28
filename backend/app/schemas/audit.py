from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    actor_id: UUID | None = None
    actor_name: str | None = None
    actor_email: str | None = None
    action: str
    entity_type: str
    entity_id: UUID
    decision_id: UUID | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    extra: dict | None = None
    created_at: datetime
