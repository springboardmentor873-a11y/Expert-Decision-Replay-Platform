from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from app.models import RoleEnum, DecisionStatus, CommentType


# --- Team Schemas ---
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    role: Optional[RoleEnum] = RoleEnum.EMPLOYEE
    team_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    team_id: Optional[int] = None
    password: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: RoleEnum


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(UserBase):
    id: int
    role: RoleEnum
    team_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    team: Optional[TeamResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- Authentication / Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


# --- Alternative Schemas ---
class AlternativeBase(BaseModel):
    title: str
    description: Optional[str] = None
    pros: Optional[List[str]] = Field(default_factory=list)
    cons: Optional[List[str]] = Field(default_factory=list)
    estimated_cost: Optional[float] = 0.0
    feasibility_score: Optional[int] = Field(default=5, ge=1, le=10)
    risk_assessment: Optional[str] = None


class AlternativeCreate(AlternativeBase):
    pass


class AlternativeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    estimated_cost: Optional[float] = None
    feasibility_score: Optional[int] = Field(default=None, ge=1, le=10)
    risk_assessment: Optional[str] = None


class AlternativeResponse(BaseModel):
    id: int
    decision_id: int
    title: str
    description: Optional[str] = None
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    estimated_cost: float = 0.0
    feasibility_score: int = 5
    risk_assessment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlternativeMetrics(BaseModel):
    total_alternatives: int
    highest_feasibility_alternative: Optional[str] = None
    lowest_cost_alternative: Optional[str] = None
    total_estimated_cost: float = 0.0
    average_feasibility: float = 0.0


class AlternativeComparisonResponse(BaseModel):
    decision_id: int
    decision_title: str
    metrics: AlternativeMetrics
    alternatives: List[AlternativeResponse]


# --- Comment & Discussion Schemas ---
class CommentCreate(BaseModel):
    content: str
    comment_type: Optional[CommentType] = CommentType.GENERAL_COMMENT
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    decision_id: int
    author_id: int
    parent_id: Optional[int] = None
    comment_type: CommentType
    content: str
    created_at: datetime
    author: Optional[UserResponse] = None
    replies: List["CommentResponse"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# --- Attachment Schemas ---
class AttachmentResponse(BaseModel):
    id: int
    decision_id: int
    comment_id: Optional[int] = None
    uploader_id: int
    file_name: str
    file_path: Optional[str] = None
    file_size: int
    mime_type: str
    download_url: Optional[str] = None
    uploaded_at: datetime
    uploader: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- Decision Version Schemas ---
class DecisionVersionResponse(BaseModel):
    id: int
    decision_id: int
    version_number: int
    snapshot_data: Dict[str, Any]
    changed_by_id: Optional[int] = None
    change_summary: Optional[str] = None
    timestamp: datetime
    changed_by: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- Decision Schemas ---
class DecisionBase(BaseModel):
    title: str
    problem_statement: str
    category: str
    status: Optional[DecisionStatus] = DecisionStatus.DRAFT


class DecisionCreate(DecisionBase):
    pass


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    category: Optional[str] = None
    status: Optional[DecisionStatus] = None
    change_summary: Optional[str] = None


class DecisionResponse(DecisionBase):
    id: int
    created_by_id: int
    creator: Optional[UserResponse] = None
    created_at: datetime
    updated_at: datetime
    version_count: int = 1
    alternatives_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DecisionDetailResponse(DecisionResponse):
    versions: List[DecisionVersionResponse] = Field(default_factory=list)
    alternatives: List[AlternativeResponse] = Field(default_factory=list)
    comments: List[CommentResponse] = Field(default_factory=list)
    attachments: List[AttachmentResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
