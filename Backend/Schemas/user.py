from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator


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
    role: Optional[str] = None  # role NAME, e.g. "manager" — always read fresh from the DB
    team_id: Optional[int] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _include_role_name(cls, obj):
        """Runs before from_attributes conversion. If given the ORM User
        object (with its .role relationship loaded), surface role.name as a
        plain string so clients never have to decode it from a JWT — which
        goes stale the moment an admin changes someone's role mid-session."""
        if not isinstance(obj, dict) and hasattr(obj, "role_id"):
            return {
                "id": obj.id,
                "full_name": obj.full_name,
                "email": obj.email,
                "role_id": obj.role_id,
                "role": obj.role.name if obj.role else None,
                "team_id": obj.team_id,
                "created_at": obj.created_at,
            }
        return obj


class UserUpdate(BaseModel):
    full_name: Optional[str] = None


class RoleUpdate(BaseModel):
    role_name: str


class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    profile_image: Optional[str] = None
