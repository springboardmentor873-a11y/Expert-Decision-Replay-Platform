from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TeamCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Unique name of the team")
    description: Optional[str] = Field(None, max_length=1000, description="Brief description of the team")
    purpose: Optional[str] = Field(None, max_length=1000, description="Specific organizational purpose or charter")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("Team name must contain at least 2 characters.")
        return stripped


class TeamUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated team name")
    description: Optional[str] = Field(None, max_length=1000, description="Updated description")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if len(stripped) < 2:
                raise ValueError("Team name must contain at least 2 characters.")
            return stripped
        return v


class TeamMemberAddRequest(BaseModel):
    user_id: int = Field(..., description="ID of the user to add to the team")
    role: Optional[str] = Field(default="Member", description="Role in team: Lead or Member")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> str:
        if v and v.strip().lower() in ("lead", "team lead"):
            return "Lead"
        return "Member"


class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int
    role: str
    joined_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_system_role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    member_count: int = 0
    members: Optional[List[TeamMemberResponse]] = None
    leader_name: Optional[str] = None
    recent_decisions: Optional[List[dict]] = None
    is_member: Optional[bool] = None
    has_pending_join_request: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)
