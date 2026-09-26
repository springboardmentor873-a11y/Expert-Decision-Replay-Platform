from pydantic import BaseModel
from datetime import datetime


class TeamCreate(BaseModel):
    name: str


class TeamResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class TeamMemberOverview(BaseModel):
    id: int
    full_name: str
    role_name: str | None = None


class TeamDecisionOverview(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    updated_at: datetime


class TeamOverviewResponse(BaseModel):
    id: int
    name: str
    member_count: int
    status: str
    members: list[TeamMemberOverview]
    recent_decisions: list[TeamDecisionOverview]