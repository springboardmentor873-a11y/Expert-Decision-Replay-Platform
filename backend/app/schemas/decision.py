from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.alternative import AlternativeOut, CriterionOut, RiskOut, StakeholderOut
from app.schemas.taxonomy import CategoryOut, TagOut


class DecisionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    problem_statement: str = Field(min_length=10)
    category_id: UUID | None = None
    team_id: UUID | None = None
    tag_ids: list[UUID] = []


class DecisionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=300)
    problem_statement: str | None = Field(default=None, min_length=10)
    category_id: UUID | None = None
    team_id: UUID | None = None
    tag_ids: list[UUID] | None = None


class DecisionOutcomeUpdate(BaseModel):
    outcome_summary: str = Field(min_length=5)
    implementation_status: str = Field(default="in_progress")


class DecisionStatusUpdate(BaseModel):
    status: str
    comment: str | None = None


class DecisionSelectAlternative(BaseModel):
    alternative_id: UUID


class DecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    problem_statement: str
    status: str
    implementation_status: str
    current_version_no: int
    owner_id: UUID
    owner_name: str | None = None
    owner_email: str | None = None
    category_id: UUID | None = None
    category: CategoryOut | None = None
    team_id: UUID | None = None
    team_name: str | None = None
    selected_alternative_id: UUID | None = None
    selected_alternative_title: str | None = None
    outcome_summary: str | None = None
    outcome_recorded_at: datetime | None = None
    tags: list[TagOut] = []
    alternatives_count: int = 0
    created_at: datetime
    updated_at: datetime


class DecisionDetailOut(DecisionOut):
    alternatives: list[AlternativeOut] = []
    criteria: list[CriterionOut] = []
    risks: list[RiskOut] = []
    stakeholders: list[StakeholderOut] = []


class DecisionVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    version_no: int
    reason: str
    snapshot: dict
    created_by_id: UUID
    created_by_name: str | None = None
    created_at: datetime


class DecisionVersionDiffOut(BaseModel):
    decision_id: UUID
    v1_no: int
    v2_no: int
    differences: dict
