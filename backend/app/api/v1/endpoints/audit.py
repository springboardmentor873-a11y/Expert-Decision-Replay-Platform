from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.models.collaboration import AuditLog
from app.models.identity import User, UserProfile
from app.schemas.audit import AuditLogOut

router = APIRouter(prefix="/audit", tags=["audit & compliance"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    actor_id: UUID | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    decision_id: UUID | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(require_role("administrator")),
    db: Session = Depends(get_db),
) -> list[AuditLogOut]:
    """Retrieve immutable audit logs (Administrator only)."""
    query = select(AuditLog)

    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
    if action:
        query = query.where(AuditLog.action == action)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if decision_id:
        query = query.where(AuditLog.decision_id == decision_id)
    if start_date:
        query = query.where(AuditLog.created_at >= start_date)
    if end_date:
        query = query.where(AuditLog.created_at <= end_date)

    logs = db.scalars(query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)).all()
    results = []
    for l in logs:
        actor = db.scalar(select(User).where(User.id == l.actor_id)) if l.actor_id else None
        prof = db.scalar(select(UserProfile).where(UserProfile.user_id == l.actor_id)) if l.actor_id else None
        a_name = prof.full_name if prof else (actor.email if actor else None)

        results.append(
            AuditLogOut(
                id=l.id,
                actor_id=l.actor_id,
                actor_name=a_name,
                actor_email=actor.email if actor else None,
                action=l.action,
                entity_type=l.entity_type,
                entity_id=l.entity_id,
                decision_id=l.decision_id,
                ip_address=l.ip_address,
                user_agent=l.user_agent,
                extra=l.extra,
                created_at=l.created_at,
            )
        )
    return results
