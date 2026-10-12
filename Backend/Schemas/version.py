from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime


class VersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    version_number: int
    changed_by_id: int
    author_name: Optional[str] = None
    change_summary: Optional[str] = None
    snapshot: Any
    created_at: datetime
