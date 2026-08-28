from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ApprovalStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    step_order: int
    name: str
    required_role_id: UUID
    required_role_code: str | None = None


class ApprovalWorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    is_default: bool = False
    steps: list[dict] = []


class ApprovalWorkflowOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    is_default: bool = False
    steps: list[ApprovalStepOut] = []


class ApprovalActionRequest(BaseModel):
    comment: str | None = None


class ApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    approval_step_id: UUID | None = None
    step_order: int
    step_name: str
    required_role_id: UUID
    required_role_code: str | None = None
    assignee_id: UUID | None = None
    actor_id: UUID | None = None
    actor_name: str | None = None
    actor_email: str | None = None
    status: str
    comment: str | None = None
    acted_at: datetime | None = None
    created_at: datetime


class ApprovalHistoryOut(BaseModel):
    decision_id: UUID
    current_status: str
    steps: list[ApprovalOut] = []
