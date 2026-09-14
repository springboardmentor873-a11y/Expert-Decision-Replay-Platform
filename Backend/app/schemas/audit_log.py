import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.audit_log import AuditAction


class AuditLogOut(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID
    decision_id: uuid.UUID
    action: AuditAction
    details: str | None
    actor_name: str | None
    decision_title: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogList(BaseModel):
    logs: list[AuditLogOut]
    total: int