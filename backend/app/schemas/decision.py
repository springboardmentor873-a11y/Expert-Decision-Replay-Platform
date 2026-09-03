import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.decision import DecisionStatus
from app.schemas.alternative import AlternativeOut
from app.schemas.attachment import AttachmentOut


class DecisionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    problem_statement: str = Field(min_length=1)
    category: str | None = Field(default=None, max_length=100)


class DecisionUpdate(BaseModel):
    """
    All fields optional — this is a partial update. Only allowed while a
    decision is still in Draft (enforced in the router, not here).
    """
    title: str | None = Field(default=None, min_length=1, max_length=200)
    problem_statement: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, max_length=100)


class DecisionOut(BaseModel):
    id: uuid.UUID
    title: str
    problem_statement: str
    category: str | None
    status: DecisionStatus
    created_by: uuid.UUID
    team_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DecisionDetail(DecisionOut):
    """Same as DecisionOut, but with the full list of alternatives and attachments."""
    alternatives: list[AlternativeOut]
    attachments: list[AttachmentOut]
