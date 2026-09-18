from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.alternative import AlternativeResponse
from app.schemas.document import DocumentResponse


class DecisionStatusEnum(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"


class CreatorSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class CategorySummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class TeamSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class TagSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DecisionCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Concise title of the decision")
    problem_statement: str = Field(..., min_length=1, description="Detailed problem statement or challenge")
    context: str = Field(..., min_length=1, description="Context, constraints, and background environment")
    decision_taken: str = Field(..., min_length=1, description="The chosen path or decision taken")
    reasoning: str = Field(..., min_length=1, description="Rationale, trade-off analysis, and justification")
    expected_outcome: Optional[str] = Field(None, description="Expected outcome or target metrics")
    actual_outcome: Optional[str] = Field(None, description="Observed outcome or results")
    category_id: Optional[int] = Field(None, description="Category classification ID")
    team_id: Optional[int] = Field(None, description="Team ID ownership")
    tag_ids: Optional[List[int]] = Field(default_factory=list, description="List of tag IDs")


class DecisionUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    problem_statement: Optional[str] = Field(None, min_length=1)
    context: Optional[str] = Field(None, min_length=1)
    decision_taken: Optional[str] = Field(None, min_length=1)
    reasoning: Optional[str] = Field(None, min_length=1)
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    status: Optional[DecisionStatusEnum] = None
    category_id: Optional[int] = None
    team_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class DecisionResponse(BaseModel):
    id: int
    title: str
    problem_statement: str
    context: str
    decision_taken: str
    reasoning: str
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    status: str
    created_by: int
    category_id: Optional[int] = None
    team_id: Optional[int] = None
    creator: Optional[CreatorSummary] = None
    category: Optional[CategorySummary] = None
    team: Optional[TeamSummary] = None
    tags: List[TagSummary] = []
    alternatives: List[AlternativeResponse] = []
    documents: List[DocumentResponse] = []
    created_at: datetime
    updated_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        if v is None:
            return []
        tags = []
        for item in v:
            if hasattr(item, "tag") and item.tag:
                tags.append({"id": item.tag.id, "name": item.tag.name})
            elif isinstance(item, dict):
                tags.append(item)
            elif hasattr(item, "id") and hasattr(item, "name"):
                tags.append({"id": item.id, "name": item.name})
        return tags

    model_config = ConfigDict(from_attributes=True)
