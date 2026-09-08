from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime


class AlternativeBase(BaseModel):
    title: str
    description: Optional[str] = None
    pros: Optional[Union[List[str], str]] = None
    cons: Optional[Union[List[str], str]] = None
    cost_estimate: Optional[str] = None
    feasibility_analysis: Optional[str] = None
    feasibility_score: Optional[int] = 5
    risk_assessment: Optional[str] = None
    risk_level: Optional[str] = "Medium"
    mitigation_plan: Optional[str] = None
    is_selected: Optional[bool] = False


class AlternativeCreate(AlternativeBase):
    pass


class AlternativeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pros: Optional[Union[List[str], str]] = None
    cons: Optional[Union[List[str], str]] = None
    cost_estimate: Optional[str] = None
    feasibility_analysis: Optional[str] = None
    feasibility_score: Optional[int] = None
    risk_assessment: Optional[str] = None
    risk_level: Optional[str] = None
    mitigation_plan: Optional[str] = None
    is_selected: Optional[bool] = None


class AlternativeOut(AlternativeBase):
    id: int
    decision_id: int
    created_at: datetime

    class Config:
        from_attributes = True
