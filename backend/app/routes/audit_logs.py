from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import or_

from datetime import datetime

from typing import Optional

from app.database import get_db
from app.models import AuditLog
from app.auth import get_current_user
from app.audit import audit_log_dict


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


# ==========================================
# ACCESS CHECK
# ==========================================
# Managers (role 3) and Administrators (role 4) may view the
# audit log. All other roles are denied. Audit logs are
# append-only: no update or delete endpoints exist.

def _require_audit_access(current_user):

    if current_user.role_id not in (3, 4):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to view audit logs"
            )
        )


# ==========================================
# GET AUDIT LOGS
# ==========================================

@router.get("/")
def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    decision_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    limit: Optional[int] = 200,
    offset: Optional[int] = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    _require_audit_access(current_user)

    query = db.query(AuditLog)

    if user_id is not None:

        query = query.filter(
            AuditLog.user_id == user_id
        )

    if action and action.strip():

        query = query.filter(
            AuditLog.action == action.strip()
        )

    if decision_id is not None:

        query = query.filter(
            AuditLog.decision_id == decision_id
        )

    if entity_type and entity_type.strip():

        query = query.filter(
            AuditLog.entity_type == entity_type.strip()
        )

    if date_from is not None:

        query = query.filter(
            AuditLog.created_at >= date_from
        )

    if date_to is not None:

        query = query.filter(
            AuditLog.created_at <= date_to
        )

    if search and search.strip():

        term = search.strip()

        query = query.filter(
            or_(
                AuditLog.description.ilike(f"%{term}%"),
                AuditLog.action.ilike(f"%{term}%"),
                AuditLog.old_value.ilike(f"%{term}%"),
                AuditLog.new_value.ilike(f"%{term}%")
            )
        )

    logs = (
        query.order_by(
            AuditLog.created_at.desc(),
            AuditLog.log_id.desc()
        )
        .offset(offset or 0)
        .limit(
            min(limit or 200, 500)
        )
        .all()
    )

    return [
        audit_log_dict(log)
        for log in logs
    ]


# ==========================================
# GET AUDIT LOGS FOR A DECISION
# ==========================================
# Used by the Decision View page. Any authenticated user who
# can view the decision may see its audit history.

@router.get("/decision/{decision_id}")
def get_decision_audit_logs(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.decision_id == decision_id
        )
        .order_by(
            AuditLog.created_at.asc(),
            AuditLog.log_id.asc()
        )
        .all()
    )

    return [
        audit_log_dict(log)
        for log in logs
    ]


# ==========================================
# GET UNIQUE AUDIT FILTER VALUES
# ==========================================
# Provides the list of available users, actions, and entity
# types for the filter dropdowns on the Audit Logs page.

@router.get("/meta")
def get_audit_meta(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    _require_audit_access(current_user)

    users = {}

    actions = set()

    entity_types = set()

    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(2000)
        .all()
    )

    for log in logs:

        if log.user_id not in users and log.user:

            users[log.user_id] = {
                "user_id": log.user_id,
                "name": log.user.name,
                "email": log.user.email
            }

        actions.add(log.action)

        entity_types.add(
            log.entity_type or "Decision"
        )

    return {
        "users": sorted(
            users.values(),
            key=lambda u: (u["name"] or "").lower()
        ),
        "actions": sorted(actions),
        "entity_types": sorted(entity_types)
    }