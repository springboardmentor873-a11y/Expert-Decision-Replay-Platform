from typing import Optional
from typing import List

from decimal import Decimal

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int
    team_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ==========================================
# DECISION
# ==========================================

class AlternativeBase(BaseModel):
    title: str
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    feasibility: Optional[str] = None
    risk_level: Optional[str] = None
    risk_explanation: Optional[str] = None
    is_recommended: Optional[bool] = False


class AlternativeCreate(AlternativeBase):
    pass


class AlternativeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    feasibility: Optional[str] = None
    risk_level: Optional[str] = None
    risk_explanation: Optional[str] = None
    is_recommended: Optional[bool] = None


class AlternativeRecommendUpdate(BaseModel):
    is_recommended: bool


class AlternativeResponse(BaseModel):
    alternative_id: int
    decision_id: int
    title: str
    description: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    estimated_cost: Optional[Decimal] = None
    feasibility: Optional[str] = None
    risk_level: Optional[str] = None
    risk_explanation: Optional[str] = None
    is_recommended: Optional[bool] = False
    created_by: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DecisionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    decision_context: Optional[str] = None
    problem_statement: Optional[str] = None
    objective: Optional[str] = None
    evaluation_criteria: Optional[str] = None
    risks: Optional[str] = None
    stakeholders: Optional[str] = None
    rationale: Optional[str] = None
    final_outcome: Optional[str] = None
    implementation_status: Optional[str] = "Not Started"
    priority: Optional[str] = "Medium"
    decision_date: Optional[datetime] = None
    status: Optional[str] = "Active"
    assigned_to: Optional[int] = None
    alternatives: Optional[List[AlternativeBase]] = []


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    decision_context: Optional[str] = None
    problem_statement: Optional[str] = None
    objective: Optional[str] = None
    evaluation_criteria: Optional[str] = None
    risks: Optional[str] = None
    stakeholders: Optional[str] = None
    rationale: Optional[str] = None
    final_outcome: Optional[str] = None
    implementation_status: Optional[str] = None
    priority: Optional[str] = None
    decision_date: Optional[datetime] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    alternatives: Optional[List[AlternativeBase]] = None


class DecisionStatusUpdate(BaseModel):
    status: str


# ==========================================
# DECISION COMMENT (DISCUSSION)
# ==========================================

class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    comment_id: int
    decision_id: int
    user_id: int
    author_name: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# DECISION DOCUMENT
# ==========================================

class DocumentResponse(BaseModel):
    document_id: int
    decision_id: int
    uploaded_by: int
    uploaded_by_name: Optional[str] = None
    original_file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DecisionResponse(BaseModel):
    decision_id: int
    expert_id: int
    expert_name: Optional[str] = None
    team_id: Optional[int] = None
    team_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    decision_context: Optional[str] = None
    problem_statement: Optional[str] = None
    objective: Optional[str] = None
    evaluation_criteria: Optional[str] = None
    risks: Optional[str] = None
    stakeholders: Optional[str] = None
    rationale: Optional[str] = None
    final_outcome: Optional[str] = None
    implementation_status: Optional[str] = None
    priority: Optional[str] = None
    decision_date: Optional[datetime] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    assigned_name: Optional[str] = None
    alternatives: Optional[List[AlternativeBase]] = []
    history: Optional[List] = []

    class Config:
        from_attributes = True