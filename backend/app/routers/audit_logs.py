from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog, User
from app.schemas.audit_log import AuditLogResponse
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .all()
    )