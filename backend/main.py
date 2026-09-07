from datetime import datetime
import json
import os
import shutil
import sys
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from Backend.Schemas.decision import (
        DECISION_STATUSES,
        AlternativeCreate,
        DecisionCreate,
        DecisionReview,
        DecisionUpdate,
        DiscussionCreate,
    )
    from Backend.Schemas.team import TeamAssign, TeamCreate
    from Backend.Schemas.user import RoleUpdate, UserCreate, UserLogin
    from database.database import Base, SessionLocal, engine
    from Backend.models.decision import Alternative, Decision, DecisionFile, DecisionVersion, Discussion
    from Backend.models.role import Role
    from Backend.models.team import Team
    from Backend.models.user import User
    from Backend.security.auth import get_current_user
    from Backend.security.jwt import create_access_token
    from Backend.security.password import hash_password, verify_password
except ImportError:
    from Schemas.decision import (
        DECISION_STATUSES,
        AlternativeCreate,
        DecisionCreate,
        DecisionReview,
        DecisionUpdate,
        DiscussionCreate,
    )
    from Schemas.team import TeamAssign, TeamCreate
    from Schemas.user import RoleUpdate, UserCreate, UserLogin
    from database.database import Base, SessionLocal, engine
    from models.decision import Alternative, Decision, DecisionFile, DecisionVersion, Discussion
    from models.role import Role
    from models.team import Team
    from models.user import User
    from security.auth import get_current_user
    from security.jwt import create_access_token
    from security.password import hash_password, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
        "http://127.0.0.1:5178",
        "http://127.0.0.1:5179",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)

ROLE_EMPLOYEE = "Employee"
ROLE_REVIEWER = "Reviewer"
ROLE_MANAGER = "Manager"
ROLE_ADMINISTRATOR = "Administrator"

ROLE_DEFINITIONS = [
    {"name": ROLE_EMPLOYEE, "description": "Creates and participates in organizational decisions."},
    {"name": ROLE_REVIEWER, "description": "Reviews decisions and provides feedback."},
    {"name": ROLE_MANAGER, "description": "Approves or rejects decisions."},
    {"name": ROLE_ADMINISTRATOR, "description": "Manages users, roles, teams, and the system."},
]


def ensure_roles(db):
    for role_data in ROLE_DEFINITIONS:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            db.add(Role(**role_data))
    db.commit()


with SessionLocal() as startup_db:
    ensure_roles(startup_db)


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
def create_roles():
    db: Session = SessionLocal()
    try:
        ensure_roles(db)
        return {"message": "Roles created successfully"}
    finally:
        db.close()


@app.get("/roles")
def get_registration_roles():
    db = SessionLocal()
    try:
        ensure_roles(db)
        return [
            {"id": role.id, "name": role.name, "description": role.description}
            for role in db.query(Role).order_by(Role.id.asc()).all()
        ]
    finally:
        db.close()

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

        role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role selection")

        # Create user
        hashed_password = hash_password(user_data.password)

        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role_id=role.id,
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
            "role_name": role.name,
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
            "role_name": get_role_name(db, user),
            "team_id": user.team_id,
            "permissions": {
                "can_review": get_role_name(db, user) in {ROLE_REVIEWER, ROLE_MANAGER, ROLE_ADMINISTRATOR},
                "can_approve": get_role_name(db, user) in {ROLE_MANAGER, ROLE_ADMINISTRATOR},
                "can_manage_users": get_role_name(db, user) == ROLE_ADMINISTRATOR,
            }
        }

    finally:
        db.close()

@app.post("/teams")
def create_team(
    team_data: TeamCreate,
    current_user: dict = Depends(get_current_user),
):
    db: Session = SessionLocal()

    try:
        require_roles(db, current_user, {ROLE_ADMINISTRATOR})
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


@app.get("/teams")
def list_teams(current_user: dict = Depends(get_current_user)):
    db: Session = SessionLocal()
    try:
        teams = db.query(Team).order_by(Team.name.asc()).all()
        return [
            {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "member_count": db.query(User).filter(User.team_id == team.id).count(),
            }
            for team in teams
        ]
    finally:
        db.close()


@app.put("/users/{user_id}/team")
def assign_user_to_team(
    user_id: int,
    team_data: TeamAssign,
    current_user: dict = Depends(get_current_user)
):
    db: Session = SessionLocal()

    try:
        require_roles(db, current_user, {ROLE_ADMINISTRATOR})
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


@app.get("/users")
def list_users(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        require_roles(db, current_user, {ROLE_ADMINISTRATOR})
        return [user_to_dict(db, user) for user in db.query(User).order_by(User.name.asc()).all()]
    finally:
        db.close()


@app.put("/users/{user_id}/role")
def assign_user_role(
    user_id: int,
    role_data: RoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        require_roles(db, current_user, {ROLE_ADMINISTRATOR})
        user = db.query(User).filter(User.id == user_id).first()
        role = db.query(Role).filter(Role.id == role_data.role_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        user.role_id = role.id
        db.commit()
        db.refresh(user)
        return user_to_dict(db, user)
    finally:
        db.close()



# =========================================================
# MILESTONE 2 - DECISION HELPERS
# =========================================================

def get_current_user_from_db(db, current_user):

    user = db.query(User).filter(
        User.id == current_user["user_id"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


def get_role_name(db, user):
    role = db.query(Role).filter(Role.id == user.role_id).first()
    return role.name if role else None


def require_roles(db, current_user, allowed_roles):
    user = get_current_user_from_db(db, current_user)
    if get_role_name(db, user) not in allowed_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action")
    return user


def user_to_dict(db, user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role_id": user.role_id,
        "role_name": get_role_name(db, user),
        "team_id": user.team_id,
    }


def get_decision_or_404(db, decision_id):

    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision

def decision_to_dict(decision, db=None):
    owner_team = None
    if db is not None:
        owner = db.query(User).filter(User.id == decision.owner_id).first()
        if owner and owner.team_id:
            team = db.query(Team).filter(Team.id == owner.team_id).first()
            owner_team = team.name if team else None

    return {
        "id": decision.id,
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "objective": decision.objective,
        "category": decision.category,
        "status": decision.status,
        "rationale": decision.rationale,
        "owner_id": decision.owner_id,
        "team_name": owner_team,
        "created_at": (
            decision.created_at.isoformat()
            if decision.created_at
            else None
        ),
        "updated_at": (
            decision.updated_at.isoformat()
            if decision.updated_at
            else None
        )
    }



# version tracking for decisions

def create_version(
    db,
    decision,
    changed_by
):

    latest = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision.id
        )
        .order_by(
            DecisionVersion.version_number.desc()
        )
        .first()
    )

    if latest:
        next_version = latest.version_number + 1
    else:
        next_version = 1

    snapshot = {
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "objective": decision.objective,
        "category": decision.category,
        "status": decision.status,
        "rationale": decision.rationale
    }

    version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        objective=decision.objective,
        category=decision.category,
        status=decision.status,
        rationale=decision.rationale,
        snapshot_json=json.dumps(snapshot),
        changed_by=changed_by
    )

    db.add(version)

    return version

@app.post("/decisions")
def create_decision(
    data: DecisionCreate,
    current_user: dict = Depends(get_current_user)
):

    if data.status not in DECISION_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid decision status"
        )

    db = SessionLocal()

    try:
        decision = Decision(
            title=data.title,
            problem_statement=data.problem_statement,
            objective=data.objective,
            category=data.category,
            status=data.status,
            rationale=data.rationale,
            owner_id=current_user["user_id"]
        )
        db.add(decision)
        db.commit()
        db.refresh(decision)

        # Automatically create Version 1
        create_version(
            db,
            decision,
            current_user["user_id"]
        )
        db.commit()
        return decision_to_dict(decision, db)

    finally:
        db.close()

@app.get("/decisions")
def get_decisions(
    current_user: dict = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        user = get_current_user_from_db(db, current_user)
        role_name = get_role_name(db, user)
        query = db.query(Decision)
        if role_name not in {ROLE_REVIEWER, ROLE_MANAGER, ROLE_ADMINISTRATOR}:
            query = query.filter(Decision.owner_id == current_user["user_id"])
        decisions = query.order_by(Decision.updated_at.desc()).all()

        return [
            decision_to_dict(d, db)
            for d in decisions
        ]

    finally:
        db.close()

@app.get("/decisions/{decision_id}")
def get_decision(
    decision_id: int,
    current_user: dict = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        decision = get_decision_or_404(
            db,
            decision_id
        )

        user = get_current_user_from_db(db, current_user)
        if decision.owner_id != current_user["user_id"] and get_role_name(db, user) not in {ROLE_REVIEWER, ROLE_MANAGER, ROLE_ADMINISTRATOR}:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this decision"
            )

        alternatives = (
            db.query(Alternative)
            .filter(
                Alternative.decision_id == decision_id
            )
            .order_by(
                Alternative.id.asc()
            )
            .all()
        )

        result = decision_to_dict(decision, db)

        result["alternatives"] = [

            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "pros": a.pros,
                "cons": a.cons,
                "cost": a.cost,
                "feasibility": a.feasibility,
                "risk": a.risk,
                "score": a.score
            }

            for a in alternatives
        ]

        return result

    finally:
        db.close()


@app.put("/decisions/{decision_id}/review")
def review_decision(
    decision_id: int,
    data: DecisionReview,
    current_user: dict = Depends(get_current_user)
):
    if data.status not in {"Under Review", "Pending", "Approved", "Rejected"}:
        raise HTTPException(status_code=400, detail="Review status must be Under Review, Pending, Approved, or Rejected")

    db = SessionLocal()
    try:
        user = require_roles(db, current_user, {ROLE_REVIEWER, ROLE_MANAGER, ROLE_ADMINISTRATOR})
        decision = get_decision_or_404(db, decision_id)
        if data.status in {"Approved", "Rejected"} and get_role_name(db, user) not in {ROLE_MANAGER, ROLE_ADMINISTRATOR}:
            raise HTTPException(status_code=403, detail="Only managers and administrators can approve or reject decisions")
        decision.status = data.status
        if data.rationale is not None:
            decision.rationale = data.rationale
        decision.updated_at = datetime.utcnow()
        create_version(db, decision, user.id)
        db.commit()
        db.refresh(decision)
        return decision_to_dict(decision, db)
    finally:
        db.close()


UPLOAD_DIR = Path(PROJECT_ROOT) / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/decisions/{decision_id}/files")
def list_decision_files(
    decision_id: int,
    current_user: dict = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        decision = get_decision_or_404(db, decision_id)
        user = get_current_user_from_db(db, current_user)
        if decision.owner_id != user.id and get_role_name(db, user) not in {ROLE_REVIEWER, ROLE_MANAGER, ROLE_ADMINISTRATOR}:
            raise HTTPException(status_code=403, detail="You do not have access to these files")
        files = db.query(DecisionFile).filter(DecisionFile.decision_id == decision_id).order_by(DecisionFile.created_at.desc()).all()
        return [{
            "id": item.id,
            "decision_id": item.decision_id,
            "original_name": item.original_name,
            "content_type": item.content_type,
            "size": item.size,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        } for item in files]
    finally:
        db.close()


@app.post("/decisions/{decision_id}/files")
def upload_decision_file(
    decision_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        decision = get_decision_or_404(db, decision_id)
        user = get_current_user_from_db(db, current_user)
        if decision.owner_id != user.id and get_role_name(db, user) not in {ROLE_REVIEWER, ROLE_MANAGER, ROLE_ADMINISTRATOR}:
            raise HTTPException(status_code=403, detail="You cannot upload to this decision")
        if not file.filename:
            raise HTTPException(status_code=400, detail="Please select a file")
        stored_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
        destination = UPLOAD_DIR / stored_name
        with destination.open("wb") as output:
            shutil.copyfileobj(file.file, output)
        size = destination.stat().st_size
        saved_file = DecisionFile(
            decision_id=decision_id,
            uploaded_by=user.id,
            original_name=Path(file.filename).name,
            stored_name=stored_name,
            content_type=file.content_type,
            size=size,
        )
        db.add(saved_file)
        db.commit()
        db.refresh(saved_file)
        return {"id": saved_file.id, "original_name": saved_file.original_name, "size": saved_file.size}
    finally:
        db.close()

@app.get("/decisions/{decision_id}/versions")
def get_decision_versions(
    decision_id: int,
    current_user: dict = Depends(get_current_user)
):
    db = SessionLocal()
    try:
        decision = get_decision_or_404(db, decision_id)
        if decision.owner_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="You do not have access to this decision")

        versions = (
            db.query(DecisionVersion)
            .filter(DecisionVersion.decision_id == decision_id)
            .order_by(DecisionVersion.version_number.asc())
            .all()
        )

        result = []
        for version in versions:
            snapshot = {}
            try:
                snapshot = json.loads(version.snapshot_json or "{}")
            except (TypeError, ValueError):
                snapshot = {}

            result.append({
                "id": version.id,
                "version_number": version.version_number,
                "title": version.title,
                "status": version.status,
                "category": version.category,
                "changed_by": version.changed_by,
                "created_at": version.created_at.isoformat() if version.created_at else None,
                "snapshot": snapshot,
            })

        return result
    finally:
        db.close()

@app.put("/decisions/{decision_id}")
def update_decision(
    decision_id: int,
    data: DecisionUpdate,
    current_user: dict = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        decision = get_decision_or_404(
            db,
            decision_id
        )

        if decision.owner_id != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You cannot edit this decision"
            )

        if data.status is not None:

            if data.status not in DECISION_STATUSES:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid decision status"
                )

            decision.status = data.status

        if data.title is not None:
            decision.title = data.title

        if data.problem_statement is not None:
            decision.problem_statement = data.problem_statement

        if data.objective is not None:
            decision.objective = data.objective

        if data.category is not None:
            decision.category = data.category

        if data.rationale is not None:
            decision.rationale = data.rationale

        decision.updated_at = datetime.utcnow()

        db.commit()

        db.refresh(decision)

        # Create a new version
        create_version(
            db,
            decision,
            current_user["user_id"]
        )

        db.commit()

        return {
            "message": "Decision updated successfully",
            "decision": decision_to_dict(decision, db)
        }

    finally:
        db.close()

# ADDING ALTERNATIVES

@app.post("/decisions/{decision_id}/alternatives")
def create_alternative(
    decision_id: int,
    data: AlternativeCreate,
    current_user: dict = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        decision = get_decision_or_404(
            db,
            decision_id
        )

        if decision.owner_id != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You cannot modify this decision"
            )

        alternative = Alternative(
            decision_id=decision_id,
            name=data.name,
            description=data.description,
            pros=data.pros,
            cons=data.cons,
            cost=data.cost,
            feasibility=data.feasibility,
            risk=data.risk,
            score=data.score
        )
        db.add(alternative)
        db.commit()
        db.refresh(alternative)

        return {
            "message": "Alternative added successfully",

            "alternative": {
                "id": alternative.id,
                "name": alternative.name,
                "description": alternative.description,
                "pros": alternative.pros,
                "cons": alternative.cons,
                "cost": alternative.cost,
                "feasibility": alternative.feasibility,
                "risk": alternative.risk,
                "score": alternative.score
            }
        }

    finally:
        db.close()

# ADDING DISCUSSION COMMENTS
@app.get("/decisions/{decision_id}/discussions")
def get_discussions(
    decision_id: int,
    current_user: dict = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        decision = get_decision_or_404(
            db,
            decision_id
        )

        discussions = (
            db.query(Discussion)
            .filter(
                Discussion.decision_id == decision_id
            )
            .order_by(
                Discussion.created_at.asc()
            )
            .all()
        )

        result = []

        for discussion in discussions:

            user = db.query(User).filter(
                User.id == discussion.user_id
            ).first()

            result.append({

                "id": discussion.id,

                "content": discussion.content,

                "note_type": discussion.note_type,

                "user_name": (
                    user.name
                    if user
                    else "User"
                ),

                "created_at": (
                    discussion.created_at.isoformat()
                    if discussion.created_at
                    else None
                )
            })

        return result

    finally:
        db.close()

@app.post("/decisions/{decision_id}/discussions")
def create_discussion(
    decision_id: int,
    data: DiscussionCreate,
    current_user: dict = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        decision = get_decision_or_404(
            db,
            decision_id
        )

        discussion = Discussion(

            decision_id=decision_id,

            user_id=current_user["user_id"],

            content=data.content,

            note_type=data.note_type
        )

        db.add(discussion)

        db.commit()

        db.refresh(discussion)

        return {
            "message": "Comment added successfully",
            "id": discussion.id
        }

    finally:
        db.close()