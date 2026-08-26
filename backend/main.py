from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session
from security.password import hash_password
from security.password import hash_password, verify_password
from security.jwt import create_access_token
from Schemas.user import UserCreate, UserLogin
from security.auth import get_current_user
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware

from database.database import engine, Base, SessionLocal
from models.role import Role
from models.user import User
from Schemas.user import UserCreate

import models.role
import models.team
import models.user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def home():
    return {"message": "Expert Decision Replay Platform API is running"}


@app.get("/health")
def health_check():
    try:
        with engine.connect():
            return {"status": "Database connected successfully"}
    except Exception as e:
        return {
            "status": "Database connection failed",
            "error": str(e)
        }

from sqlalchemy.orm import Session
from database.database import SessionLocal
from models.role import Role


@app.post("/setup/roles")
def create_roles():
    db: Session = SessionLocal()

    roles = [
        {
            "name": "Employee",
            "description": "Creates and participates in organizational decisions."
        },
        {
            "name": "Reviewer",
            "description": "Reviews decisions and provides feedback."
        },
        {
            "name": "Manager",
            "description": "Approves or rejects decisions."
        },
        {
            "name": "Administrator",
            "description": "Manages users, roles, teams, and the system."
        }
    ]

    for role_data in roles:
        existing_role = db.query(Role).filter(
            Role.name == role_data["name"]
        ).first()

        if not existing_role:
            db.add(Role(**role_data))

    db.commit()
    db.close()

    return {"message": "Roles created successfully"}

@app.post("/register")
def register_user(user_data: UserCreate):
    db: Session = SessionLocal()

    try:
        # Check if email already exists
        existing_user = db.query(User).filter(
            User.email == user_data.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Check if role exists
        role = db.query(Role).filter(
            Role.id == user_data.role_id
        ).first()

        if not role:
            raise HTTPException(
                status_code=400,
                detail="Invalid role_id"
            )

        # Create user
        hashed_password = hash_password(user_data.password)

        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role_id=user_data.role_id,
            team_id=user_data.team_id
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User registered successfully",
            "user_id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role_id": new_user.role_id,
            "team_id": new_user.team_id
        }

    finally:
        db.close()

@app.post("/login")
def login_user(user_data: UserLogin):
    db: Session = SessionLocal()

    try:
        # Find user by email
        user = db.query(User).filter(
            User.email == user_data.email
        ).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Verify password
        if not verify_password(
            user_data.password,
            user.password_hash
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Create JWT token
        access_token = create_access_token(
            {
                "user_id": user.id,
                "role_id": user.role_id
            }
        )

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer"
        }

    finally:
        db.close()

@app.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    db: Session = SessionLocal()

    try:
        user = db.query(User).filter(
            User.id == current_user["user_id"]
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "message": "Authenticated successfully",
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role_id": user.role_id,
            "team_id": user.team_id
        }

    finally:
        db.close()

from models.team import Team
from Schemas.team import TeamCreate, TeamAssign
@app.post("/teams")
def create_team(team_data: TeamCreate):
    db: Session = SessionLocal()

    try:
        existing_team = db.query(Team).filter(
            Team.name == team_data.name
        ).first()

        if existing_team:
            raise HTTPException(
                status_code=400,
                detail="Team already exists"
            )

        new_team = Team(
            name=team_data.name,
            description=team_data.description
        )

        db.add(new_team)
        db.commit()
        db.refresh(new_team)

        return {
            "message": "Team created successfully",
            "team_id": new_team.id,
            "name": new_team.name,
            "description": new_team.description
        }

    finally:
        db.close()


@app.put("/users/{user_id}/team")
def assign_user_to_team(
    user_id: int,
    team_data: TeamAssign
):
    db: Session = SessionLocal()

    try:
        # Find user
        user = db.query(User).filter(
            User.id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Find team
        team = db.query(Team).filter(
            Team.id == team_data.team_id
        ).first()

        if not team:
            raise HTTPException(
                status_code=404,
                detail="Team not found"
            )

        # Assign team
        user.team_id = team.id

        db.commit()
        db.refresh(user)

        return {
            "message": "User assigned to team successfully",
            "user_id": user.id,
            "user_name": user.name,
            "team_id": team.id,
            "team_name": team.name
        }

    finally:
        db.close()