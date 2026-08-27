from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field

from app.models import RoleEnum


# ---------- Auth ----------

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    job_title: Optional[str] = None
    department: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class MessageResponse(BaseModel):
    message: str


# ---------- Users ----------

class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: RoleEnum
    job_title: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """
    Safe self-service profile fields only.
    role / is_active / hashed_password are intentionally excluded —
    those require administrator-only endpoints.
    """
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    job_title: Optional[str] = Field(default=None, max_length=150)
    department: Optional[str] = Field(default=None, max_length=150)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class RoleUpdate(BaseModel):
    role: RoleEnum


# ---------- Teams ----------

class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    manager_id: Optional[str] = None


class TeamOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    created_at: datetime
    members: List[UserOut] = []

    class Config:
        from_attributes = True


class TeamMemberAdd(BaseModel):
    user_id: str


# ---------- Audit ----------

class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Health ----------

class HealthResponse(BaseModel):
    status: str
    project: str
    database: str
