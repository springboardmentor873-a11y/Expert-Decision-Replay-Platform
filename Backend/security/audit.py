from typing import Optional

from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.user import User


def log_action(
    db: Session,
    *,
    actor: Optional[User],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    actor_email: Optional[str] = None,
) -> AuditLog:
    """Write one audit log row and commit it immediately, independent of
    whatever transaction the caller is in the middle of, so the entry is
    durable even if the caller's own commit happens later or fails."""
    entry = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor_email or (actor.email if actor else None),
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
