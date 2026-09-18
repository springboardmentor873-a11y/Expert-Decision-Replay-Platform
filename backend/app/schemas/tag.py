from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TagCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    description: Optional[str] = Field(None, max_length=255)


class TagResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DecisionTagAssignRequest(BaseModel):
    tag_ids: List[int] = Field(..., min_length=1, description="List of tag IDs to assign")
