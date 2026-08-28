from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None = None
    is_system: bool = True


class RoleAssignRequest(BaseModel):
    role_code: str


class UserStatusUpdate(BaseModel):
    is_active: bool


class TeamMemberOut(BaseModel):
    team_id: UUID
    user_id: UUID
    full_name: str
    email: str
    role_code: str
    created_at: datetime


class TeamMemberAdd(BaseModel):
    user_id: UUID


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    created_by_id: UUID | None = None
    members: list[TeamMemberOut] = []
    created_at: datetime
    updated_at: datetime
