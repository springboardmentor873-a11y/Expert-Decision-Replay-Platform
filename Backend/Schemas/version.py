from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class VersionOut(BaseModel):
    id: int
    decision_id: int
    version_number: int
    changed_by_id: int
    author_name: Optional[str] = None
    change_summary: Optional[str] = None
    snapshot: Any
    created_at: datetime

    class Config:
        from_attributes = True
