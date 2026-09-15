from datetime import datetime
from pydantic import BaseModel


class DiscussionCreate(BaseModel):
    comment: str


class DiscussionResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True