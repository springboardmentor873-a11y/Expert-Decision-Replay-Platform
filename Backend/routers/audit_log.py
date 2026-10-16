from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.database import get_db
from models.audit_log import AuditLog
from security.auth import require_role
from Schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["Audit & Compliance"])


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    action: Optional[str] = Query(None, description="Exact action name, e.g. decision.status_changed"),
    entity_type: Optional[str] = Query(None, description="e.g. decision, user, team, comment, attachment"),
    entity_id: Optional[int] = None,
    actor_id: Optional[int] = None,
    since: Optional[datetime] = Query(None, description="Only entries at/after this timestamp"),
    until: Optional[datetime] = Query(None, description="Only entries at/before this timestamp"),
    limit: int = Query(100, le=500),
    offset: int = 0,
    admin=Depends(require_role("administrator")),
    db: Session = Depends(get_db),
):
    """The full compliance trail. Administrator-only, since it exposes
    activity across every user and team, not just the caller's own work."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id is not None:
        query = query.filter(AuditLog.entity_id == entity_id)
    if actor_id is not None:
        query = query.filter(AuditLog.actor_id == actor_id)
    if since:
        query = query.filter(AuditLog.created_at >= since)
    if until:
        query = query.filter(AuditLog.created_at <= until)

    return (
        query.order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[AuditLogOut])
def list_audit_logs_for_entity(
    entity_type: str,
    entity_id: int,
    admin=Depends(require_role("administrator")),
    db: Session = Depends(get_db),
):
    """Convenience route: the full history for one specific record, e.g. the
    complete audit trail for a single decision."""
    return (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
        .order_by(AuditLog.created_at.asc())
        .all()
    )
