from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database.database import Base, engine, get_db
import models  # noqa: registers every model (incl. Decision/Alternative/etc.) with Base
from models.role import Role
from models.team import Team
from models.user import User, UserProfile
from Schemas.user import (
    ProfileUpdate,
    RoleUpdate,
    UserCreate,
    UserLogin,
    UserOut,
    UserUpdate,
)
from Schemas.team import AssignTeam, TeamCreate, TeamOut
from security.auth import get_current_user, require_role
from security.jwt import create_access_token
from security.password import hash_password, verify_password
from routers import decisions, alternatives, comments, attachments, versions

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expert Decision Replay Platform",
    description=(
        "Milestone 1 (Auth, Roles, Teams, Profiles) + "
        "Milestone 2 (Decisions, Alternatives, Discussion, Files, Versions)"
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(comments.router)
app.include_router(attachments.router)
app.include_router(versions.router)


def seed_default_roles(db: Session):
    """Creates the four fixed roles on startup if they don't already exist."""
    defaults = ["employee", "reviewer", "manager", "administrator"]
    for name in defaults:
        if not db.query(Role).filter(Role.name == name).first():
            db.add(Role(name=name))
    db.commit()


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    seed_default_roles(db)


@app.get("/")
def root():
    return {"message": "Expert Decision Replay Platform API is running"}


# ---------- Authentication ----------

@app.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = db.query(Role).filter(Role.name == user.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Unknown role: {user.role_name}")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role_id=role.id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Every user gets an (initially empty) profile row.
    db.add(UserProfile(user_id=new_user.id))
    db.commit()

    return new_user


@app.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role = db.query(Role).filter(Role.id == user.role_id).first()
    token = create_access_token({"sub": user.email, "role": role.name})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@app.put("/me", response_model=UserOut)
def update_my_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if updates.full_name is not None:
        current_user.full_name = updates.full_name
    db.commit()
    db.refresh(current_user)
    return current_user


@app.put("/me/profile")
def update_my_extended_profile(
    updates: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return {
        "phone": profile.phone,
        "department": profile.department,
        "designation": profile.designation,
        "profile_image": profile.profile_image,
    }


# ---------- Admin: User & Role Management ----------

@app.get("/users", response_model=List[UserOut])
def list_all_users(
    admin=Depends(require_role("administrator")), db: Session = Depends(get_db)
):
    return db.query(User).all()


@app.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    updates: RoleUpdate,
    admin=Depends(require_role("administrator")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.name == updates.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Unknown role: {updates.role_name}")

    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return user


# ---------- Team Management ----------

@app.post("/teams", response_model=TeamOut)
def create_team(
    team: TeamCreate,
    admin=Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
):
    existing = db.query(Team).filter(Team.name == team.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A team with this name already exists")

    if team.manager_id is not None:
        manager = db.query(User).filter(User.id == team.manager_id).first()
        if not manager:
            raise HTTPException(status_code=404, detail="manager_id does not match any user")

    new_team = Team(name=team.name, manager_id=team.manager_id)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


@app.get("/teams", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@app.put("/teams/assign/{user_id}")
def assign_user_to_team(
    user_id: int,
    assignment: AssignTeam,
    admin=Depends(require_role("administrator", "manager")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    team = db.query(Team).filter(Team.id == assignment.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user.team_id = assignment.team_id
    db.commit()
    db.refresh(user)
    return {"message": f"{user.full_name} assigned to team {team.name}"}
