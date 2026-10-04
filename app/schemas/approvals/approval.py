from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ApprovalCreate(BaseModel):
    decision_id: int
    reviewer_id: int
    approval_level: int = Field(ge=1)
    status: str = "Pending"
    due_date: Optional[datetime] = None


class ApprovalUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class ApprovalResponse(BaseModel):
    id: int
    decision_id: int
    reviewer_id: int
    approval_level: int
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    escalated_from_id: Optional[int] = None
    due_date: Optional[datetime] = None
    reminder_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApprovalEscalate(BaseModel):
    new_reviewer_id: int
    reason: Optional[str] = None