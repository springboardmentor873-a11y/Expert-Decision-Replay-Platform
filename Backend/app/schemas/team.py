import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.decision import DecisionStatus
from app.models.team_join_request import TeamJoinRequestStatus
from app.models.user import UserRole


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class TeamOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime
    member_count: int
    decision_count: int


class TeamMemberOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class TeamDecisionOut(BaseModel):
    id: uuid.UUID
    title: str
    status: DecisionStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamDetailOut(TeamOut):
    members: list[TeamMemberOut]
    decisions: list[TeamDecisionOut]


class TeamAssign(BaseModel):
    team_id: uuid.UUID
    # Moving an employee who is already on a team is a deliberate action —
    # the caller must opt in explicitly instead of it happening silently.
    confirm_reassignment: bool = False


class TeamJoinRequestOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    team_id: uuid.UUID
    status: TeamJoinRequestStatus
    created_at: datetime
    updated_at: datetime
    reviewed_at: datetime | None
    reviewed_by: uuid.UUID | None

    model_config = ConfigDict(from_attributes=True)


class TeamJoinRequestAdminOut(BaseModel):
    """A join request with named requester and team for the management view."""
    id: uuid.UUID
    user_id: uuid.UUID
    team_id: uuid.UUID
    status: TeamJoinRequestStatus
    requester_name: str
    requester_email: EmailStr
    team_name: str
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by: uuid.UUID | None