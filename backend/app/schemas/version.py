from pydantic import BaseModel
from datetime import datetime


class VersionResponse(BaseModel):
    id: int
    decision_id: int
    version_number: int
    title: str
    description: str | None = None
    status: str
    priority: str
    changed_by: int
    created_at: datetime

    class Config:
        from_attributes = True