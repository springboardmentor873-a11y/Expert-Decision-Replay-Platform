from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ---------- User ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


# ---------- Alternative ----------

class AlternativeCreate(BaseModel):
    name: str
    description: Optional[str] = None


class AlternativeOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    decision_id: int

    class Config:
        from_attributes = True


# ---------- Review ----------

class ReviewCreate(BaseModel):
    comment: str
    status: Optional[str] = "Pending"


class ReviewOut(BaseModel):
    id: int
    comment: str
    status: str
    decision_id: int

    class Config:
        from_attributes = True


# ---------- Decision History (version tracking) ----------

class HistoryCreate(BaseModel):
    action: str
    description: Optional[str] = None


class HistoryOut(BaseModel):
    id: int
    action: str
    description: Optional[str] = None
    decision_id: int

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


# ---------- Document ----------

class DocumentOut(BaseModel):
    id: int
    filename: str
    filepath: str
    decision_id: int
    uploaded_by: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ---------- Comment (Discussion Module) ----------

class CommentCreate(BaseModel):
    content: str
    is_meeting_note: Optional[int] = 0
    user_id: Optional[int] = None


class CommentOut(BaseModel):
    id: int
    content: str
    is_meeting_note: int
    decision_id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Decision ----------

class DecisionCreate(BaseModel):
    title: str
    problem: str
    reasoning: str
    category: Optional[str] = None
    user_id: Optional[int] = None


class DecisionEditUpdate(BaseModel):
    title: Optional[str] = None
    problem: Optional[str] = None
    reasoning: Optional[str] = None
    category: Optional[str] = None


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

    class Config:
        from_attributes = True


class DecisionDetailOut(DecisionOut):
    alternatives: List[AlternativeOut] = []
    reviews: List[ReviewOut] = []
    history: List[HistoryOut] = []
    outcome: Optional[OutcomeOut] = None