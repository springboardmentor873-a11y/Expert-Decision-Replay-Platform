from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMINISTRATOR = "Administrator"
    MANAGER = "Manager"
    REVIEWER = "Reviewer"
    EMPLOYEE = "Employee"


class UserCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    employee_id: str = Field(min_length=1, max_length=50)
    department: str = Field(min_length=1, max_length=100)
    designation: str = Field(min_length=1, max_length=150)
    phone_number: str = Field(min_length=6, max_length=20)


class UserSelfRegister(BaseModel):
    """Public self-registration always creates an Employee account."""
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    employee_id: str = Field(min_length=1, max_length=50)
    department: str = Field(min_length=1, max_length=100)
    designation: str = Field(min_length=1, max_length=150)
    phone_number: str = Field(min_length=6, max_length=20)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    """Separated from UserUpdate so role changes require an explicit,
    server-side-authorized call (Administrator only)."""
    role: UserRole


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    employee_id: str
    department: str
    designation: str
    phone_number: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
