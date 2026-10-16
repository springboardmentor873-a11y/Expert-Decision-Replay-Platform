from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from models.approval_step import ApprovalStepStatus


class ApprovalWorkflowCreate(BaseModel):
    reviewer_ids: List[int] = Field(
        ..., min_length=1, description="Reviewer user IDs in approval order (level 1 first)"
    )


class ApprovalDecisionIn(BaseModel):
    decision: Literal["approve", "reject"]
    comment: Optional[str] = None


class ApprovalEscalateIn(BaseModel):
    new_reviewer_id: int
    comment: Optional[str] = None


class ApprovalStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    level: int
    reviewer_id: int
    status: ApprovalStepStatus
    comment: Optional[str] = None
    assigned_by_id: int
    created_at: datetime
    decided_at: Optional[datetime] = None
