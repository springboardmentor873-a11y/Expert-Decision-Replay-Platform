from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    department: str = Field(min_length=1, max_length=100)


class TeamMemberResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    designation: str

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: int
    name: str
    department: str
    created_at: datetime
    member_count: int

    class Config:
        from_attributes = True


class TeamDetailResponse(TeamResponse):
    members: List[TeamMemberResponse]


class AddTeamMember(BaseModel):
    user_id: int
