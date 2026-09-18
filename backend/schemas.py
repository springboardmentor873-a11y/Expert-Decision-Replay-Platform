from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, DecisionStatusEnum, ApprovalStatusEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: RoleEnum = RoleEnum.EMPLOYEE

class UserCreate(UserBase):
    password: str

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    is_active: bool
    teams: List[TeamResponse] = []
    
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

# Approvals
class ApprovalBase(BaseModel):
    status: ApprovalStatusEnum = ApprovalStatusEnum.PENDING
    comments: Optional[str] = None

class ApprovalCreate(ApprovalBase):
    pass

class ApprovalResponse(ApprovalBase):
    id: int
    decision_id: int
    reviewer_id: int
    created_at: datetime
    updated_at: datetime
    reviewer: UserResponse

    class Config:
        from_attributes = True

# Notifications
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    content: str
    is_read: bool
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Logs
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Decisions
class DecisionBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: DecisionStatusEnum = DecisionStatusEnum.DRAFT
    team_id: Optional[int] = None

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
    team: Optional[TeamResponse] = None
    alternatives: List[AlternativeResponse] = []
    discussions: List[DiscussionResponse] = []
    documents: List[DocumentResponse] = []
    approvals: List[ApprovalResponse] = []

    class Config:
        from_attributes = True

