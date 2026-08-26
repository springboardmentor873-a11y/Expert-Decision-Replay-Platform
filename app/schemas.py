from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


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