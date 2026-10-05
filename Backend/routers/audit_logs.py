from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.database import get_db
from models.audit_log import AuditLog
from models.user import User
from Schemas.audit_log import AuditLogOut
from security.auth import require_role

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    decision_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager", "administrator")),
):
    query = db.query(AuditLog)
    if decision_id is not None:
        query = query.filter(AuditLog.decision_id == decision_id)
    return query.order_by(AuditLog.created_at.desc()).limit(200).all()
