from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.decision import CreatorSummary


class ReviewerSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ApprovalActionRequest(BaseModel):
    comment: Optional[str] = Field(None, max_length=2000, description="Optional approval comments or review notes")


class RejectActionRequest(BaseModel):
    reason: Optional[str] = Field(
        None,
        max_length=2000,
        description="Mandatory justification and feedback explaining the rejection reason"
    )
    rejection_reason: Optional[str] = Field(
        None,
        max_length=2000,
        description="Alias for reason"
    )
    comment: Optional[str] = Field(None, max_length=2000, description="Optional supplementary comments or advice")

    @model_validator(mode="after")
    def validate_reason_present(self):
        resolved = (self.reason or self.rejection_reason or "").strip()
        if not resolved:
            raise ValueError("Rejection reason is mandatory and cannot be empty.")
        self.reason = resolved
        self.rejection_reason = resolved
        return self


class ApprovalResponse(BaseModel):
    id: int
    decision_id: int
    reviewer_id: int
    reviewer: Optional[ReviewerSummary] = None
    action: str
    previous_status: str
    new_status: str
    rejection_reason: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PendingApprovalResponse(BaseModel):
    id: int
    title: str
    problem_statement: str
    context: str
    decision_taken: str
    status: str
    created_by: int
    creator: Optional[CreatorSummary] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
