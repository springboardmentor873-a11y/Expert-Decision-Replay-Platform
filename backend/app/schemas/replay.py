from pydantic import BaseModel
from datetime import datetime


class ReplayResponse(BaseModel):
    version_number: int
    title: str
    description: str | None = None
    status: str
    priority: str
    changed_by: int
    created_at: datetime
    changes: list[str]