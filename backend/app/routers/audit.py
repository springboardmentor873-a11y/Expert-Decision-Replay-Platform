from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models import AuditLog, User, RoleEnum
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get(
    "",
    response_model=List[AuditLogOut],
    summary="List audit log entries (Administrator only)",
)
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
    action: Optional[str] = Query(default=None, description="Filter by action, e.g. 'login'"),
    search: Optional[str] = Query(default=None, description="Search actor email or details"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = db.query(AuditLog).join(User, AuditLog.actor_id == User.id, isouter=True)

    if action:
        query = query.filter(AuditLog.action == action)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter((User.email.ilike(like)) | (AuditLog.details.ilike(like)))

    rows = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return [
        AuditLogOut(
            id=row.id,
            actor_id=row.actor_id,
            actor_email=row.actor.email if row.actor else None,
            action=row.action,
            details=row.details,
            ip_address=row.ip_address,
            created_at=row.created_at,
        )
        for row in rows
    ]
