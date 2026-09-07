from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AlternativeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name or title of the alternative")
    description: str = Field(..., min_length=1, description="Detailed description of the alternative")
    pros: str = Field(..., min_length=1, description="Strengths, benefits, and advantages")
    cons: str = Field(..., min_length=1, description="Weaknesses, drawbacks, and limitations")
    cost: Optional[str] = Field(None, max_length=100, description="Estimated financial or operational cost")
    feasibility: Optional[str] = Field(None, max_length=50, description="Feasibility assessment (e.g. High, Medium, Low)")
    risk_assessment: Optional[str] = Field(None, description="Risk analysis and mitigation factors")
    is_selected: Optional[bool] = Field(False, description="Whether this alternative is the chosen option")


class AlternativeUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    pros: Optional[str] = Field(None, min_length=1)
    cons: Optional[str] = Field(None, min_length=1)
    cost: Optional[str] = Field(None, max_length=100)
    feasibility: Optional[str] = Field(None, max_length=50)
    risk_assessment: Optional[str] = None
    is_selected: Optional[bool] = None


class AlternativeResponse(BaseModel):
    id: int
    decision_id: int
    name: str
    description: str
    pros: str
    cons: str
    cost: Optional[str] = None
    feasibility: Optional[str] = None
    risk_assessment: Optional[str] = None
    is_selected: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)