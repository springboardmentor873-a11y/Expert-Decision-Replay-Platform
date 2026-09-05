from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    user_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
