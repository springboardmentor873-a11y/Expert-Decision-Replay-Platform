from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DecisionStatusEnum(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class CreatorSummary(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class DecisionCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Concise title of the decision")
    problem_statement: str = Field(..., min_length=1, description="Detailed problem statement or challenge")
    context: str = Field(..., min_length=1, description="Context, constraints, and background environment")
    decision_taken: str = Field(..., min_length=1, description="The chosen path or decision taken")
    reasoning: str = Field(..., min_length=1, description="Rationale, trade-off analysis, and justification")
    expected_outcome: Optional[str] = Field(None, description="Expected outcome or target metrics")
    actual_outcome: Optional[str] = Field(None, description="Observed outcome or results")


class DecisionUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    problem_statement: Optional[str] = Field(None, min_length=1)
    context: Optional[str] = Field(None, min_length=1)
    decision_taken: Optional[str] = Field(None, min_length=1)
    reasoning: Optional[str] = Field(None, min_length=1)
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    status: Optional[DecisionStatusEnum] = None


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
    creator: Optional[CreatorSummary] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)