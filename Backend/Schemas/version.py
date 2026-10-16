from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DecisionVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    version: int
    title: str
    problem_statement: Optional[str] = None
    category: str
    status: str
    rationale: Optional[str] = None
    change_summary: Optional[str] = None
    created_by_id: int
    created_at: datetime
