from datetime import datetime
from pydantic import BaseModel, EmailStr


from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "EMPLOYEE"
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: str
    email: EmailStr


class TeamCreate(BaseModel):
    name: str
    description: str | None = None
    manager_id: int


class TeamResponse(BaseModel):
    id: int
    name: str
    description: str | None
    manager_id: int | None

    class Config:
        from_attributes = True


class TeamMemberCreate(BaseModel):
    team_id: int
    user_id: int


class TeamMemberResponse(BaseModel):
    id: int
    team_id: int
    user_id: int

    class Config:
        from_attributes = True


class DecisionCreate(BaseModel):
    title: str
    description: str
    decision_type: str
    created_by: int
    team_id: int | None = None
    tags: str | None = None
    rationale: str | None = None


class DecisionResponse(BaseModel):
    id: int
    title: str
    description: str
    decision_type: str
    status: str
    created_by: int
    team_id: int | None
    tags: str | None = None
    rationale: str | None = None

    class Config:
        from_attributes = True


class DecisionUpdate(BaseModel):
    title: str
    description: str
    decision_type: str
    status: str
    team_id: int | None = None
    tags: str | None = None
    rationale: str | None = None


class TimelineEventCreate(BaseModel):
    decision_id: int
    event_type: str
    title: str
    description: str | None = None
    actor_id: int | None = None
    actor_name: str | None = None
    actor_role: str | None = None


class TimelineEventResponse(BaseModel):
    id: int
    decision_id: int
    event_type: str
    title: str
    description: str | None
    actor_id: int | None
    actor_name: str | None
    actor_role: str | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True



class ApprovalSubmit(BaseModel):
    reviewer_id: int | None = None
    manager_id: int | None = None
    notes: str | None = None


class ApprovalAction(BaseModel):
    action: str
    comments: str | None = None
    user_id: int | None = None
    user_role: str | None = None


class ApprovalEscalate(BaseModel):
    reason: str
    user_id: int | None = None
    user_role: str | None = None


class ApprovalResponse(BaseModel):
    id: int
    decision_id: int
    stage: int
    stage_name: str
    reviewer_id: int | None
    status: str
    comments: str | None
    escalated: bool
    escalation_reason: str | None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link_id: int | None

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    user_name: str | None
    action: str
    entity_type: str
    entity_id: int | None
    details: str | None
    ip_address: str | None

    class Config:
        from_attributes = True