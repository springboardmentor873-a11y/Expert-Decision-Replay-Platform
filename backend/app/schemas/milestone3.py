from pydantic import BaseModel, Field


class AssignReviewerIn(BaseModel):
    reviewer_id: int
    approval_level: int = Field(default=1, ge=1, le=10)


class ReviewIn(BaseModel):
    action: str
    comment: str | None = None
