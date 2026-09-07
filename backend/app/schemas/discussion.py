from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DiscussionUserSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DiscussionCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Discussion comment content")


class DiscussionUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Updated comment content")


class DiscussionResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    parent_id: Optional[int] = None
    content: str
    user: Optional[DiscussionUserSummary] = None
    created_at: datetime
    updated_at: datetime
    replies: List["DiscussionResponse"] = []

    model_config = ConfigDict(from_attributes=True)
