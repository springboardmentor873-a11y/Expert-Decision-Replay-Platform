from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.database import get_db
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse
from app.services.audit_service import get_audit_log_by_id, get_audit_logs

router = APIRouter()

# Reusable role dependency: only Administrator and Manager are allowed to view audit logs
allow_audit_viewers = require_roles(RoleEnum.ADMINISTRATOR, RoleEnum.MANAGER)


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List audit logs",
    description="Returns paginated audit logs with optional filters. Accessible strictly to Administrator and Manager.",
)
def list_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    action: Optional[str] = Query(None, description="Filter by action enum value"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    user_id: Optional[int] = Query(None, description="Filter by acting user ID"),
    start_date: Optional[datetime] = Query(None, description="Filter events after timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter events before timestamp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_audit_viewers),
):
    """
    List audit logs with comprehensive filtering and newest-first ordering.
    Strictly read-only.
    """
    # Extract default values if invoked directly in tests without FastAPI dependency resolution
    def _val(param, default=None):
        from fastapi.params import Query as QueryParam
        if isinstance(param, QueryParam):
            return param.default
        return param

    p_page = _val(page, 1) or 1
    p_page_size = _val(page_size, 20) or 20
    p_action = _val(action, None)
    p_entity_type = _val(entity_type, None)
    p_entity_id = _val(entity_id, None)
    p_user_id = _val(user_id, None)
    p_start_date = _val(start_date, None)
    p_end_date = _val(end_date, None)

    return get_audit_logs(
        db=db,
        page=p_page,
        page_size=p_page_size,
        action=p_action,
        entity_type=p_entity_type,
        entity_id=p_entity_id,
        user_id=p_user_id,
        start_date=p_start_date,
        end_date=p_end_date,
    )


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
    summary="Get single audit log entry",
    description="Retrieves a single audit log entry by ID. Accessible strictly to Administrator and Manager.",
)
def get_single_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_audit_viewers),
):
    """
    Retrieves full details of a specific audit log entry.
    Strictly read-only. No PUT, PATCH, or DELETE allowed.
    """
    return get_audit_log_by_id(db=db, audit_log_id=audit_log_id)
