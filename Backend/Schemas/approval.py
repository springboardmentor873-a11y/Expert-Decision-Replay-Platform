from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ApprovalActionCreate(BaseModel):
    action: str  # "Approved", "Rejected", "Changes Requested", "Escalated"
    comments: Optional[str] = None


class ApprovalAssignCreate(BaseModel):
    assigned_to_id: Optional[int] = None
    stage: int = 1


class ApprovalEscalateCreate(BaseModel):
    escalation_reason: str


class ApprovalActionResponse(BaseModel):
    id: int
    workflow_id: int
    decision_id: int
    user_id: int
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    stage: int
    action: str
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApprovalWorkflowResponse(BaseModel):
    id: int
    decision_id: int
    decision_title: Optional[str] = None
    stage: int
    status: str
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    assigned_role_id: Optional[int] = None
    assigned_role_name: Optional[str] = None
    due_date: Optional[datetime] = None
    is_escalated: bool = False
    escalated_at: Optional[datetime] = None
    escalation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    actions: List[ApprovalActionResponse] = []

    class Config:
        from_attributes = True
