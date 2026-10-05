from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from models.decision import DecisionCategory, DecisionStatus


class DecisionCreate(BaseModel):
    title: str
    problem_statement: Optional[str] = None
    category: DecisionCategory
    rationale: Optional[str] = None
    team_id: Optional[int] = None


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    category: Optional[DecisionCategory] = None
    status: Optional[DecisionStatus] = None
    rationale: Optional[str] = None
    change_summary: Optional[str] = None  # recorded in the version snapshot
    team_id: Optional[int] = None


class DecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    problem_statement: Optional[str] = None
    category: DecisionCategory
    status: DecisionStatus
    rationale: Optional[str] = None
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    version: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
