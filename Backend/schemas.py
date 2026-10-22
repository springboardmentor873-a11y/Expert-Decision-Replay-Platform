from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# ---------- User ----------

# Roles the sign-up form may request. `reviewer` is a non-manager role with the
# same workspace access as an employee (the register form offers it).
VALID_ROLES = {"employee", "reviewer", "manager", "admin", "administrator"}


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str = "employee"

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name cannot be empty")
        return cleaned

    @field_validator("email")
    @classmethod
    def _normalise_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("role")
    @classmethod
    def _check_role(cls, value: str) -> str:
        cleaned = (value or "employee").strip().lower()
        if cleaned not in VALID_ROLES:
            raise ValueError(
                "Role must be one of: " + ", ".join(sorted(VALID_ROLES))
            )
        return cleaned


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _normalise_email(cls, value: str) -> str:
        return value.strip().lower()


class UserRoleUpdate(BaseModel):
    """Manager-supplied role change. Restricted to the roles the UI knows about."""

    role: str = Field(min_length=1, max_length=32)

    @field_validator("role")
    @classmethod
    def _normalise_role(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if cleaned not in VALID_ROLES:
            raise ValueError(
                "Role must be one of: " + ", ".join(sorted(VALID_ROLES))
            )
        return cleaned


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------- Alternative ----------

class AlternativeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Alternative name cannot be empty")
        return cleaned


class AlternativeOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    decision_id: int

    model_config = {"from_attributes": True}


# ---------- Review ----------

class ReviewCreate(BaseModel):
    comment: str = Field(min_length=1)
    status: Optional[str] = "Pending"


class ReviewOut(BaseModel):
    id: int
    comment: str
    status: str
    decision_id: int

    model_config = {"from_attributes": True}


# ---------- Decision History (version tracking) ----------

class HistoryOut(BaseModel):
    id: int
    action: str
    description: Optional[str] = None
    decision_id: int
    changed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------- Outcome ----------

class OutcomeCreate(BaseModel):
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    result: Optional[str] = None


class OutcomeOut(BaseModel):
    id: int
    expected_outcome: Optional[str] = None
    actual_outcome: Optional[str] = None
    result: Optional[str] = None
    decision_id: int

    model_config = {"from_attributes": True}


# ---------- Document ----------

class DocumentOut(BaseModel):
    id: int
    filename: str
    filepath: str
    decision_id: int
    uploaded_by: Optional[int] = None
    uploaded_at: datetime
    file_size: Optional[int] = None
    content_type: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------- Comment (Discussion Module) ----------

class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    is_meeting_note: bool = False
    user_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def _strip_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Comment cannot be empty")
        return cleaned

    @field_validator("is_meeting_note", mode="before")
    @classmethod
    def _coerce_flag(cls, value):
        # The frontend historically sent 0/1 for this flag.
        if isinstance(value, (int, float)):
            return bool(value)
        return value


class CommentOut(BaseModel):
    id: int
    content: str
    is_meeting_note: bool
    decision_id: int
    user_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Decision ----------

class DecisionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    problem: str = Field(min_length=1)
    reasoning: str = Field(min_length=1)
    category: Optional[str] = Field(default=None, max_length=100)
    user_id: Optional[int] = None

    @field_validator("title", "category")
    @classmethod
    def _strip(cls, value):
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class DecisionEditUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    problem: Optional[str] = None
    reasoning: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)


class DecisionUpdate(BaseModel):
    final_decision: Optional[str] = None
    status: Optional[str] = None


class DecisionOut(BaseModel):
    id: int
    title: str
    problem: str
    reasoning: str
    final_decision: Optional[str] = None
    status: str
    category: Optional[str] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DecisionDetailOut(DecisionOut):
    alternatives: List[AlternativeOut] = []
    reviews: List[ReviewOut] = []
    history: List[HistoryOut] = []
    outcome: Optional[OutcomeOut] = None


# ---------- Approval workflow ----------

class ApprovalDecision(BaseModel):
    comments: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("comments")
    @classmethod
    def _strip(cls, value):
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None