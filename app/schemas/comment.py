from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str
    mentioned_user_ids: list[int] = []


class CommentResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True