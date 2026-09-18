from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ApprovalStepCreate(BaseModel):
    step_number: int = Field(..., ge=1, description="Sequential level/step number")
    reviewer_id: int = Field(..., description="User ID assigned to review this step")
    due_date: Optional[datetime] = Field(None, description="Due date for escalation check")


class ApprovalStepActionRequest(BaseModel):
    action: str = Field(..., description="'Approved' or 'Rejected'")
    comments: Optional[str] = Field(None, max_length=1000)


class ApprovalStepResponse(BaseModel):
    id: int
    workflow_id: int
    step_number: int
    reviewer_id: int
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    status: str
    comments: Optional[str] = None
    due_date: Optional[datetime] = None
    acted_at: Optional[datetime] = None
    is_overdue: bool = False

    model_config = ConfigDict(from_attributes=True)


class ApprovalWorkflowCreateRequest(BaseModel):
    name: Optional[str] = Field("Multi-Level Approval Workflow", max_length=255)
    steps: List[ApprovalStepCreate] = Field(..., min_length=1, description="Sequential approval steps")


class ApprovalWorkflowResponse(BaseModel):
    id: int
    decision_id: int
    name: str
    status: str
    created_by: Optional[int] = None
    creator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    steps: List[ApprovalStepResponse] = []
    current_step_number: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
