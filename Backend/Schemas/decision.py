from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from Schemas.alternative import AlternativeCreate, AlternativeOut


class DecisionBase(BaseModel):
    title: str
    problem_statement: str
    objective: Optional[str] = None
    context: Optional[str] = None
    category: Optional[str] = "General"
    priority: Optional[str] = "Medium"
    team_id: Optional[int] = None


class DecisionCreate(DecisionBase):
    initial_alternatives: Optional[List[AlternativeCreate]] = None


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    objective: Optional[str] = None
    context: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    team_id: Optional[int] = None
    selected_alternative_id: Optional[int] = None
    decision_rationale: Optional[str] = None
    change_summary: Optional[str] = None


class DecisionStatusUpdate(BaseModel):
    status: str
    decision_rationale: Optional[str] = None


class DecisionSelectAlternative(BaseModel):
    selected_alternative_id: int
    decision_rationale: Optional[str] = None


class DecisionOut(DecisionBase):
    id: int
    status: str
    created_by_id: int
    author_name: Optional[str] = None
    team_name: Optional[str] = None
    current_version: int
    selected_alternative_id: Optional[int] = None
    decision_rationale: Optional[str] = None
    alternatives_count: Optional[int] = 0
    documents_count: Optional[int] = 0
    comments_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
