from datetime import datetime
from pydantic import BaseModel


class ApprovalCreate(BaseModel):
    decision_id: int
    reviewer_id: int | None = None


class ApprovalReview(BaseModel):
    status: str
    comments: str | None = None


class ApprovalResponse(BaseModel):
    id: int
    decision_id: int
    reviewer_id: int | None
    status: str
    comments: str | None
    created_at: datetime
    reviewed_at: datetime | None

    class Config:
        from_attributes = True