from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TeamJoinRequestCreate(BaseModel):
    message: Optional[str] = Field(None, max_length=500, description="Optional note or reason for requesting to join")


class TeamJoinRequestReview(BaseModel):
    action: str = Field(..., description="Action to take: APPROVE or REJECT")
    notes: Optional[str] = Field(None, max_length=500, description="Optional review notes")


class TeamJoinRequestResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    status: str
    message: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    team_name: Optional[str] = None
    requester_name: Optional[str] = None
    requester_email: Optional[str] = None
    requester_role: Optional[str] = None
    reviewer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
