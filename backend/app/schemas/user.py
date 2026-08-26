from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.role import RoleEnum


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (minimum 8 characters)")
    role: RoleEnum = Field(default=RoleEnum.EMPLOYEE, description="Role name: Employee, Reviewer, Manager, Administrator")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Full name cannot be empty or whitespace only.")
        return stripped

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.strip()) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class UserStatusUpdateRequest(BaseModel):
    is_active: bool = Field(..., description="Active or inactive status for the user account")


class UserRoleUpdateRequest(BaseModel):
    role: RoleEnum = Field(..., description="New role for the user: Employee, Reviewer, Manager, Administrator")


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_id: int
    role: Optional[RoleResponse] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)