from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

import models.role  # noqa: F401
import models.team  # noqa: F401
import models.user  # noqa: F401
from models.profile import UserProfile
from models.role import Role
from models.team import Team
from models.user import User
from database.database import Base, SessionLocal, engine
from security.auth import get_current_user
from security.jwt import create_access_token
from security.password import hash_password, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_required_data(db: Session):
    roles = [
        "Employee",
        "Reviewer",
        "Manager",
        "Administrator",
    ]

    for role_name in roles:
        existing = db.query(Role).filter(Role.name.ilike(role_name)).first()
        if not existing:
            db.add(Role(name=role_name, description=f"{role_name} role"))

    general_team = db.query(Team).filter(Team.name.ilike("General")).first()
    if not general_team:
        db.add(Team(name="General", description="Default development team"))

    db.commit()


@app.on_event("startup")
def initialize_data():
    db = SessionLocal()
    try:
        seed_required_data(db)
    finally:
        db.close()


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., min_length=1)
    team: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


@app.get("/")
def home():
    return {"message": "Expert Decision Replay Platform API is running"}


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "Database connected successfully"}
    except Exception as exc:
        return {"status": "Database connection failed", "error": str(exc)}


@app.post("/api/auth/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    normalized_email = payload.email.lower().strip()
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    role = db.query(Role).filter(Role.name.ilike(payload.role.strip())).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")

    team_name = (payload.team or "General").strip() or "General"
    team = db.query(Team).filter(Team.name.ilike(team_name)).first()
    if not team:
        raise HTTPException(status_code=400, detail="Invalid team")

    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        team_id=team.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        db.add(UserProfile(user_id=user.id))
        db.commit()

    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": role.name,
        "team": team.name,
    }


@app.post("/register")
def register_user_compat(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(payload, db)


@app.post("/api/auth/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({"user_id": user.id, "role_id": user.role_id})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/login")
def login_user_compat(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_user(payload, db)


@app.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    profile = current_user.profile or UserProfile(user_id=current_user.id)
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "team_id": current_user.team_id,
        "role": current_user.role.name if current_user.role else None,
        "team": current_user.team.name if current_user.team else None,
        "phone": profile.phone,
        "department": profile.department,
        "designation": profile.designation,
        "profile_image": profile.profile_image,
    }


@app.get("/api/auth/me")
def get_my_profile_api(current_user: User = Depends(get_current_user)):
    return get_my_profile(current_user)