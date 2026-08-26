from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., min_length=1)
    team: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    role: str
    team: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"