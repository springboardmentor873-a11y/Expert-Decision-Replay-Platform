from uuid import UUID as UUIDType

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.audit_log import AuditAction
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogList
from app.services.audit_service import query_audit_logs

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])


@router.get("", response_model=AuditLogList)
async def list_audit_logs(
    decision_id: UUIDType | None = Query(default=None),
    actor_id: UUIDType | None = Query(default=None),
    action: AuditAction | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    logs, total = await query_audit_logs(
        db,
        decision_id=decision_id,
        actor_id=actor_id,
        action=action,
        limit=limit,
        offset=offset,
    )
    return AuditLogList(logs=logs, total=total)