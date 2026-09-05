from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role_name: str = "employee"  # employee | reviewer | manager | administrator


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role_id: int
    team_id: Optional[int] = None
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: Optional[str] = None


class RoleUpdate(BaseModel):
    role_name: str


class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    profile_image: Optional[str] = None
