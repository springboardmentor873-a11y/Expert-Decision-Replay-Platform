from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, DecisionStatusEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: RoleEnum = RoleEnum.EMPLOYEE

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Alternatives
class AlternativeBase(BaseModel):
    description: str
    pros: Optional[str] = None
    cons: Optional[str] = None
    cost: Optional[str] = None
    feasibility: Optional[str] = None
    risk: Optional[str] = None

class AlternativeCreate(AlternativeBase):
    pass

class AlternativeResponse(AlternativeBase):
    id: int
    decision_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Discussions
class DiscussionBase(BaseModel):
    content: str

class DiscussionCreate(DiscussionBase):
    pass

class DiscussionResponse(DiscussionBase):
    id: int
    decision_id: int
    user_id: int
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

# Documents
class DocumentBase(BaseModel):
    filename: str

class DocumentCreate(DocumentBase):
    file_path: str

class DocumentResponse(DocumentBase):
    id: int
    decision_id: int
    file_path: str
    uploaded_by_id: int
    uploaded_at: datetime
    uploaded_by: UserResponse

    class Config:
        from_attributes = True

# Decisions
class DecisionBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: DecisionStatusEnum = DecisionStatusEnum.DRAFT

class DecisionCreate(DecisionBase):
    pass

class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[DecisionStatusEnum] = None

class DecisionResponse(DecisionBase):
    id: int
    version: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    creator: UserResponse
    alternatives: List[AlternativeResponse] = []
    discussions: List[DiscussionResponse] = []
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True

