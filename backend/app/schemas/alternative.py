from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AlternativeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    sort_order: int = 0


class AlternativeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    sort_order: int | None = None
    is_selected: bool | None = None


class AlternativeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    title: str
    description: str | None = None
    sort_order: int = 0
    is_selected: bool = False
    total_score: float | None = None
    created_at: datetime
    updated_at: datetime


class CriterionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    weight: float = Field(default=1.0, gt=0)
    sort_order: int = 0


class CriterionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    weight: float | None = Field(default=None, gt=0)
    sort_order: int | None = None


class CriterionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    name: str
    description: str | None = None
    weight: float
    sort_order: int
    created_at: datetime
    updated_at: datetime


class EvaluationCreate(BaseModel):
    alternative_id: UUID
    criterion_id: UUID
    score: float = Field(ge=0, le=100)
    notes: str | None = None


class EvaluationBatchItem(BaseModel):
    alternative_id: UUID
    criterion_id: UUID
    score: float = Field(ge=0, le=100)
    notes: str | None = None


class EvaluationBatchUpdate(BaseModel):
    evaluations: list[EvaluationBatchItem]


class AlternativeEvaluationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    alternative_id: UUID
    criterion_id: UUID
    score: float
    notes: str | None = None
    evaluated_by_id: UUID | None = None
    created_at: datetime


class EvaluationMatrixOut(BaseModel):
    criteria: list[CriterionOut]
    alternatives: list[AlternativeOut]
    evaluations: list[AlternativeEvaluationOut]


class RiskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    severity: str = Field(default="medium", max_length=20)
    likelihood: str = Field(default="medium", max_length=20)
    mitigation: str | None = None


class RiskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    severity: str | None = Field(default=None, max_length=20)
    likelihood: str | None = Field(default=None, max_length=20)
    mitigation: str | None = None


class RiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    title: str
    description: str | None = None
    severity: str
    likelihood: str
    mitigation: str | None = None
    created_at: datetime
    updated_at: datetime


class StakeholderCreate(BaseModel):
    user_id: UUID | None = None
    display_name: str = Field(min_length=1, max_length=200)
    stakeholder_role: str | None = Field(default=None, max_length=120)


class StakeholderUpdate(BaseModel):
    user_id: UUID | None = None
    display_name: str | None = Field(default=None, min_length=1, max_length=200)
    stakeholder_role: str | None = Field(default=None, max_length=120)


class StakeholderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    decision_id: UUID
    user_id: UUID | None = None
    display_name: str
    stakeholder_role: str | None = None
    created_at: datetime
    updated_at: datetime
