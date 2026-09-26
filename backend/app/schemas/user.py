from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role_id: int
    team_id: int | None = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role_id: int
    role_name: str | None = None
    team_id: int | None = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str