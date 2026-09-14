import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.approval import ApprovalAction, ApprovalStage


class ApprovalCreate(BaseModel):
    reason: str | None = None


class ApprovalActionRequest(BaseModel):
    action: ApprovalAction
    approval_stage: ApprovalStage


class ApprovalOut(BaseModel):
    id: uuid.UUID
    decision_id: uuid.UUID
    user_id: uuid.UUID
    action: ApprovalAction
    approval_stage: ApprovalStage
    reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApprovalList(BaseModel):
    approvals: list[ApprovalOut]
    total: int


class DecisionApprovalStatus(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    current_stage: str | None
    can_review: bool

    model_config = ConfigDict(from_attributes=True)
