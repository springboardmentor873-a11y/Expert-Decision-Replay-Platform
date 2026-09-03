import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AlternativeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    pros: str | None = None
    cons: str | None = None
    estimated_cost: float | None = Field(default=None, ge=0)
    risk_notes: str | None = None


class AlternativeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    pros: str | None = None
    cons: str | None = None
    estimated_cost: float | None = Field(default=None, ge=0)
    risk_notes: str | None = None


class AlternativeOut(BaseModel):
    id: uuid.UUID
    decision_id: uuid.UUID
    title: str
    pros: str | None
    cons: str | None
    estimated_cost: float | None
    risk_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
