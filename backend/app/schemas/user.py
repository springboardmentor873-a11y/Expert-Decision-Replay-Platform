"""
Pydantic schemas used for request validation and response shaping
around users, authentication, and teams.
"""

import re
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

ALLOWED_ROLES = ["Employee", "Reviewer", "Manager", "Administrator"]


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "Employee"
    team_id: Optional[int] = None

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Full name is required.")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
            raise ValueError("Password must contain both letters and numbers.")
        return v

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        if v not in ALLOWED_ROLES:
            raise ValueError(f"Role must be one of {ALLOWED_ROLES}.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    team_id: Optional[int] = None
    team_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RoleUpdateRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        if v not in ALLOWED_ROLES:
            raise ValueError(f"Role must be one of {ALLOWED_ROLES}.")
        return v


class TeamAssignRequest(BaseModel):
    team_id: Optional[int] = None


class TeamCreate(BaseModel):
    team_name: str
    manager_id: Optional[int] = None

    @field_validator("team_name")
    @classmethod
    def team_name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Team name is required.")
        return v.strip()


class TeamOut(BaseModel):
    id: int
    team_name: str
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    created_at: Optional[str] = None
