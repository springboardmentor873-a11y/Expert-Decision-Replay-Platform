from datetime import datetime, UTC
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.collaboration import AuditLog


def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: UUID,
    actor_id: UUID | None = None,
    decision_id: UUID | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    extra: dict[str, Any] | None = None,
) -> AuditLog:
    """Record an immutable audit log entry in the database."""
    log_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        decision_id=decision_id,
        ip_address=ip_address,
        user_agent=user_agent,
        extra=extra or {},
    )
    db.add(log_entry)
    db.flush()
    return log_entry
