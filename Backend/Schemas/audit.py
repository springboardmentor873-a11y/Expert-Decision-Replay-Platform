from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action_category: str
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    logs: List[AuditLogResponse]


class AuditStatsResponse(BaseModel):
    total_logs: int
    security_events_count: int
    approvals_count: int
    decisions_count: int
    access_events_count: int
    recent_security_alerts: List[AuditLogResponse] = []
