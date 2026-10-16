from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator

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
    team_id: Optional[int] = None
    change_summary: Optional[str] = None  # recorded in the version snapshot


class DecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    problem_statement: Optional[str] = None
    category: DecisionCategory
    status: DecisionStatus
    rationale: Optional[str] = None
    version: int
    created_by_id: int
    team_id: Optional[int] = None
    creator_team_id: Optional[int] = None  # the creator's team or explicit team, for team-scoped filtering
    creator_name: Optional[str] = None  # the creator's full name, for display (graph, lists)
    created_at: datetime
    updated_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def _include_creator_team_id(cls, obj):
        if not isinstance(obj, dict) and hasattr(obj, "created_by_id"):
            effective_team_id = getattr(obj, "team_id", None)
            if effective_team_id is None and getattr(obj, "creator", None):
                effective_team_id = obj.creator.team_id
            return {
                "id": obj.id,
                "title": obj.title,
                "problem_statement": obj.problem_statement,
                "category": obj.category,
                "status": obj.status,
                "rationale": obj.rationale,
                "version": obj.version,
                "created_by_id": obj.created_by_id,
                "team_id": obj.team_id,
                "creator_team_id": effective_team_id,
                "creator_name": obj.creator.full_name if obj.creator else None,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
            }
        return obj
