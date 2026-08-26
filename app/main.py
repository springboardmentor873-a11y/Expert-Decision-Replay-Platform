from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from . import models
from .schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
     UserUpdate,
    TeamCreate,

    TeamResponse,
    TeamMemberCreate,
    TeamMemberResponse
)
from .security import hash_password, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
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


@app.get("/")
def root():
    return {
        "message": "Expert Decision Replay Platform API is running"
    }


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful",
        "user_id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email,
        "role": existing_user.role
    }
@app.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db)
):
    allowed_roles = [
        "EMPLOYEE",
        "REVIEWER",
        "MANAGER",
        "ADMINISTRATOR"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.role = role

    db.commit()
    db.refresh(user)

    return {
        "message": "Role updated successfully",
        "user_id": user.id,
        "role": user.role
    }
@app.post("/teams", response_model=TeamResponse)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db)
):
    manager = db.query(models.User).filter(
        models.User.id == team.manager_id
    ).first()

    if not manager:
        raise HTTPException(
            status_code=404,
            detail="Manager not found"
        )

    if manager.role != "MANAGER":
        raise HTTPException(
            status_code=400,
            detail="Selected user is not a MANAGER"
        )

    existing_team = db.query(models.Team).filter(
        models.Team.name == team.name
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="Team already exists"
        )

    new_team = models.Team(
        name=team.name,
        description=team.description,
        manager_id=team.manager_id
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team
@app.get("/teams", response_model=list[TeamResponse])
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(models.Team).all()
    return teams
@app.post("/teams/{team_id}/members")
def add_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(
        models.Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User already belongs to this team"
        )

    member = models.TeamMember(
        team_id=team_id,
        user_id=user_id
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "message": "User added to team successfully",
        "team_id": team_id,
        "user_id": user_id
    }
@app.get("/teams/{team_id}")
def get_team(
    team_id: int,
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(
        models.Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    members = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id
    ).all()

    users = []

    for member in members:
        user = db.query(models.User).filter(
            models.User.id == member.user_id
        ).first()

        if user:
            users.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            })

    return {
        "team_id": team.id,
        "team_name": team.name,
        "description": team.description,
        "members": users
    }
@app.post("/teams", response_model=TeamResponse)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db)
):
    existing_team = db.query(models.Team).filter(
        models.Team.name == team.name
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="Team already exists"
        )

    if team.manager_id:
        manager = db.query(models.User).filter(
            models.User.id == team.manager_id
        ).first()

        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager not found"
            )

        if manager.role != "MANAGER":
            raise HTTPException(
                status_code=400,
                detail="Selected user is not a MANAGER"
            )

    new_team = models.Team(
        name=team.name,
        description=team.description,
        manager_id=team.manager_id
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team
@app.post("/team-members", response_model=TeamMemberResponse)
def add_team_member(
    member: TeamMemberCreate,
    db: Session = Depends(get_db)
):
    team = db.query(models.Team).filter(
        models.Team.id == member.team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    user = db.query(models.User).filter(
        models.User.id == member.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == member.team_id,
        models.TeamMember.user_id == member.user_id
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this team"
        )

    new_member = models.TeamMember(
        team_id=member.team_id,
        user_id=member.user_id
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return new_member
@app.delete("/teams/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="User is not a member of this team"
        )

    db.delete(member)
    db.commit()

    return {
        "message": "User removed from team successfully"
    }
@app.get("/users/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user