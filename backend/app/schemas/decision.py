from datetime import datetime

from pydantic import BaseModel


class DecisionCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "Draft"
    priority: str = "Medium"


class DecisionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None


class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True