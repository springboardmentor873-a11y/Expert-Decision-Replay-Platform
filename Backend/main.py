from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database.database import engine, Base, SessionLocal
from models.role import Role
from models.team import Team
from models.user import User
from Schemas.user import UserCreate, UserLogin
from Schemas.team import TeamCreate, TeamAssign
from security.password import hash_password, verify_password
from security.jwt import create_access_token
from security.auth import get_current_user

# Create database tables if database is available
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database initialization deferred or failed: {e}")

app = FastAPI(
    title="Expert Decision Replay Platform",
    description="Backend API for capturing, managing, reviewing, and replaying expert decisions."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.post("/setup/roles")
def create_roles(db: Session = Depends(get_db)):
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
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            db.add(Role(**role_data))

    db.commit()
    return {"message": "Roles created successfully"}


@app.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description
        }
        for r in roles
    ]


@app.post("/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check if role exists
    role = db.query(Role).filter(Role.id == user_data.role_id).first()
    if not role:
        raise HTTPException(
            status_code=400,
            detail="Invalid role_id"
        )

    # Check team if provided
    if user_data.team_id:
        team = db.query(Team).filter(Team.id == user_data.team_id).first()
        if not team:
            raise HTTPException(
                status_code=400,
                detail="Invalid team_id"
            )

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


@app.post("/login")
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {
            "user_id": user.id,
            "role_id": user.role_id,
            "email": user.email,
            "name": user.name
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    role = db.query(Role).filter(Role.id == user.role_id).first()
    team = db.query(Team).filter(Team.id == user.team_id).first() if user.team_id else None

    return {
        "message": "Authenticated successfully",
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role_id": user.role_id,
        "role_name": role.name if role else None,
        "team_id": user.team_id,
        "team_name": team.name if team else None
    }


@app.get("/teams")
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description
        }
        for t in teams
    ]


@app.post("/teams")
def create_team(team_data: TeamCreate, db: Session = Depends(get_db)):
    existing_team = db.query(Team).filter(Team.name == team_data.name).first()
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


@app.put("/users/{user_id}/team")
def assign_user_to_team(
    user_id: int,
    team_data: TeamAssign,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    team = db.query(Team).filter(Team.id == team_data.team_id).first()
    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

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