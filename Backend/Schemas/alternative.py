from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlternativeCreate(BaseModel):
    title: str
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_cost: Optional[float] = 0.0
    risk_score: Optional[float] = 0.0
    feasibility_score: Optional[float] = 0.0


class AlternativeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    title: str
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_cost: Optional[float] = None
    risk_score: float
    feasibility_score: float
    is_recommended: int
    composite_score: float
    created_at: datetime
