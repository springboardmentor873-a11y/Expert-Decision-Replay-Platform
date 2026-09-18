from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from app.models.audit_log import AuditActionEnum, AuditLog
from app.models.user import User

# Sensitive keys that must NEVER be stored in audit details
SENSITIVE_KEYS = {
    "password",
    "hashed_password",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "credentials",
    "authorization",
    "cookie",
    "cookies",
}


def sanitize_details(details: Any) -> Any:
    """
    Recursively strips any sensitive keys and cleans serialized dictionaries.
    """
    if details is None:
        return None
    if isinstance(details, dict):
        sanitized = {}
        for k, v in details.items():
            if str(k).lower() in SENSITIVE_KEYS:
                continue
            sanitized[k] = sanitize_details(v)
        return sanitized
    if isinstance(details, list):
        return [sanitize_details(item) for item in details]
    return details


def create_audit_log(
    db: Session,
    action: Union[AuditActionEnum, str],
    entity_type: str,
    description: str,
    user_id: Optional[int] = None,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    skip_commit: bool = False,
) -> AuditLog:
    """
    Creates and records an immutable audit log entry.
    Extracts client IP and user agent if request is provided.
    """
    action_val = action.value if hasattr(action, "value") else str(action)

    # Extract client IP and user agent if request object supplied
    if request:
        if not ip_address:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                ip_address = forwarded.split(",")[0].strip()
            elif request.client:
                ip_address = request.client.host
        if not user_agent:
            user_agent = request.headers.get("user-agent")

    clean_details = sanitize_details(details)

    audit_entry = AuditLog(
        user_id=user_id,
        action=action_val,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        details=clean_details,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(audit_entry)
    if not skip_commit:
        db.commit()
        db.refresh(audit_entry)

    return audit_entry


def get_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Retrieves paginated audit logs with filtering by action, entity, user, and date range.
    Always ordered newest first.
    """
    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    if action and action.strip():
        query = query.filter(AuditLog.action == action.strip())

    if entity_type and entity_type.strip():
        query = query.filter(AuditLog.entity_type == entity_type.strip())

    if entity_id is not None:
        query = query.filter(AuditLog.entity_id == entity_id)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)

    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).offset(offset).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def get_audit_log_by_id(db: Session, audit_log_id: int) -> AuditLog:
    """
    Retrieves a single audit log entry by ID. Raises 404 if not found.
    """
    audit_entry = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user))
        .filter(AuditLog.id == audit_log_id)
        .first()
    )
    if not audit_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log entry with ID {audit_log_id} not found."
        )
    return audit_entry