from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import shutil
import io
import csv
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from .database import Base, engine, SessionLocal
from . import models

from .schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TeamCreate,
    TeamResponse,
    TeamMemberResponse,
    DecisionCreate,
    DecisionResponse,
    DecisionUpdate,
    TimelineEventCreate,
    TimelineEventResponse,
    ApprovalSubmit,
    ApprovalAction,
    ApprovalEscalate,
    ApprovalResponse,
    NotificationResponse,
    AuditLogResponse,
)

from .security import hash_password, verify_password


Base.metadata.create_all(bind=engine)

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE decisions ADD COLUMN IF NOT EXISTS tags VARCHAR(500) DEFAULT ''"))
        conn.execute(text("ALTER TABLE decisions ADD COLUMN IF NOT EXISTS rationale VARCHAR(1000) DEFAULT ''"))
        conn.commit()
except Exception as e:
    print("Column addition check (safe):", e)

DEFAULT_TEAMS = [
    ("Development Team", "Software development team"),
    ("AI Development", "AI project team"),
    ("Engineering Team", "Software development team"),
    ("Data Analytics", "Data analytics, business intelligence, and insights reporting"),
    ("Cloud Computing", "Cloud architecture, infrastructure management, and scalability"),
    ("DevOps & Infrastructure", "CI/CD automation, cloud pipelines, and system reliability"),
    ("Cybersecurity", "Security compliance, threat monitoring, and data privacy"),
]

try:
    with SessionLocal() as db_seed:
        for t_name, t_desc in DEFAULT_TEAMS:
            if not db_seed.query(models.Team).filter(models.Team.name == t_name).first():
                db_seed.add(models.Team(name=t_name, description=t_desc))
        db_seed.commit()
except Exception as e:
    print("Team seed check (safe):", e)


app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0.0",
)


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


def _clean_param(val, default=None):
    if hasattr(val, "default"):
        return val.default
    return val if val is not None else default


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    user_id: int | None = None,
    user_name: str | None = None,
    details: str | None = None,
    ip_address: str | None = None,
):
    try:
        log_entry = models.AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address or "127.0.0.1",
            created_at=datetime.utcnow(),
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Error logging audit event:", e)


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "INFO",
    link_id: int | None = None,
):
    try:
        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            is_read=False,
            link_id=link_id,
            created_at=datetime.utcnow(),
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Error creating notification:", e)


@app.get("/")
def root():
    return {
        "message": "Expert Decision Replay Platform API is running"
    }


@app.post("/users", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    allowed_roles = [
        "EMPLOYEE",
        "REVIEWER",
        "MANAGER",
        "ADMINISTRATOR"
    ]

    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
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
        "role": existing_user.role,
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
        "ADMINISTRATOR",
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
        "role": user.role,
    }


@app.get(
    "/users/{user_id}",
    response_model=UserResponse
)
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


@app.post(
    "/teams",
    response_model=TeamResponse
)
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
        manager_id=team.manager_id,
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team


@app.get(
    "/teams",
    response_model=list[TeamResponse]
)
def get_teams(
    db: Session = Depends(get_db)
):
    return db.query(models.Team).all()


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
            users.append(
                {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                }
            )

    return {
        "team_id": team.id,
        "team_name": team.name,
        "description": team.description,
        "members": users,
    }


@app.post(
    "/teams/{team_id}/members",
    response_model=TeamMemberResponse
)
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

    existing_member = db.query(
        models.TeamMember
    ).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id,
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

    return member


@app.delete(
    "/teams/{team_id}/members/{user_id}"
)
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    member = db.query(
        models.TeamMember
    ).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id,
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


@app.post(
    "/decisions",
    response_model=DecisionResponse
)
def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.id == decision.created_by
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if decision.team_id is not None:
        team = db.query(models.Team).filter(
            models.Team.id == decision.team_id
        ).first()

        if not team:
            raise HTTPException(
                status_code=404,
                detail="Team not found"
            )

    tags_val = getattr(decision, "tags", "") or ""
    rationale_val = getattr(decision, "rationale", "") or ""

    new_decision = models.Decision(
        title=decision.title,
        description=decision.description,
        decision_type=decision.decision_type,
        status="DRAFT",
        created_by=decision.created_by,
        team_id=decision.team_id,
        tags=tags_val,
        rationale=rationale_val,
    )

    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)

    try:
        timeline_event = models.DecisionTimelineEvent(
            decision_id=new_decision.id,
            event_type="CREATED",
            title=f"Decision Proposal: {new_decision.title}",
            description=f"Drafted by {user.name}. Rationale: {rationale_val or new_decision.description[:120]}",
            actor_id=user.id,
            actor_name=user.name,
            actor_role=user.role,
            created_at=datetime.utcnow(),
        )
        db.add(timeline_event)
        db.commit()
    except Exception as e:
        print("Timeline event logging notice:", e)

    log_audit_event(
        db=db,
        action="CREATE_DECISION",
        entity_type="DECISION",
        entity_id=new_decision.id,
        user_id=user.id,
        user_name=user.name,
        details=f"Created decision '{new_decision.title}' ({new_decision.decision_type})",
    )

    return new_decision


@app.get(
    "/decisions",
    response_model=list[DecisionResponse]
)
def get_all_decisions(
    db: Session = Depends(get_db)
):
    return db.query(
        models.Decision
    ).all()


@app.get(
    "/decisions/{decision_id}",
    response_model=DecisionResponse
)
def get_decision_by_id(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(
        models.Decision
    ).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision


@app.put(
    "/decisions/{decision_id}",
    response_model=DecisionResponse
)
def update_decision(
    decision_id: int,
    decision_data: DecisionUpdate,
    db: Session = Depends(get_db),
):
    decision = db.query(
        models.Decision
    ).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    if decision_data.team_id is not None:
        team = db.query(
            models.Team
        ).filter(
            models.Team.id == decision_data.team_id
        ).first()

        if not team:
            raise HTTPException(
                status_code=404,
                detail="Team not found"
            )

    decision.title = decision_data.title
    decision.description = decision_data.description
    decision.decision_type = decision_data.decision_type
    decision.status = decision_data.status
    decision.team_id = decision_data.team_id
    if hasattr(decision_data, "tags") and decision_data.tags is not None:
        decision.tags = decision_data.tags
    if hasattr(decision_data, "rationale") and decision_data.rationale is not None:
        decision.rationale = decision_data.rationale

    db.commit()
    db.refresh(decision)

    return decision


@app.put("/decisions/{decision_id}/status")
def update_decision_status(
    decision_id: int,
    status: str,
    user_role: str | None = Query(default=None),
    role: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    x_user_role: str | None = Header(default=None, alias="x-user-role"),
    db: Session = Depends(get_db)
):
    allowed_statuses = [
        "DRAFT",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
    ]

    normalized_status = status.strip().upper() if status else ""

    if normalized_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Allowed statuses are: {', '.join(allowed_statuses)}"
        )

    effective_role = (user_role or role or x_user_role or "").strip().upper()
    if not effective_role and user_id is not None:
        user_record = db.query(models.User).filter(models.User.id == user_id).first()
        if user_record and user_record.role:
            effective_role = user_record.role.strip().upper()

    if effective_role not in ["MANAGER", "ADMINISTRATOR"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied: Only Managers have authority to update decision status."
        )

    decision = db.query(
        models.Decision
    ).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    decision.status = normalized_status

    db.commit()
    db.refresh(decision)

    log_audit_event(
        db=db,
        action="UPDATE_STATUS",
        entity_type="DECISION",
        entity_id=decision.id,
        user_id=user_id,
        user_name=f"{effective_role} (User #{user_id or '?'})",
        details=f"Decision #{decision.id} status changed to {normalized_status} by {effective_role}",
    )

    return {
        "message": "Decision status updated successfully",
        "decision_id": decision.id,
        "status": decision.status,
    }


@app.delete("/decisions/{decision_id}")
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(
        models.Decision
    ).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    uploaded_files = db.query(
        models.UploadedFile
    ).filter(
        models.UploadedFile.decision_id == decision_id
    ).all()

    for uploaded_file in uploaded_files:
        if os.path.exists(uploaded_file.file_path):
            os.remove(uploaded_file.file_path)

        db.delete(uploaded_file)

    db.flush()

    db.delete(decision)

    db.commit()

    return {
        "message": "Decision and uploaded files deleted successfully"
    }


@app.post("/decisions/{decision_id}/upload")
def upload_decision_file(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    decision = db.query(
        models.Decision
    ).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    upload_folder = "uploads"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    file_path = os.path.join(
        upload_folder,
        file.filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    uploaded_file = models.UploadedFile(
        filename=file.filename,
        file_path=file_path,
        decision_id=decision_id,
    )

    db.add(uploaded_file)
    db.commit()
    db.refresh(uploaded_file)

    return {
        "message": "File uploaded successfully",
        "file_id": uploaded_file.id,
        "filename": uploaded_file.filename,
        "file_path": uploaded_file.file_path,
        "decision_id": uploaded_file.decision_id,
    }


@app.get("/decisions/{decision_id}/files")
def get_uploaded_files(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(
        models.Decision
    ).filter(
        models.Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    files = db.query(
        models.UploadedFile
    ).filter(
        models.UploadedFile.decision_id == decision_id
    ).all()

    return files


@app.get("/files")
def get_all_uploaded_files(
    db: Session = Depends(get_db)
):
    files = db.query(models.UploadedFile).all()
    results = []
    for f in files:
        decision = db.query(models.Decision).filter(models.Decision.id == f.decision_id).first()
        uploader = None
        if decision:
            uploader = db.query(models.User).filter(models.User.id == decision.created_by).first()
        
        file_size_str = "Unknown size"
        if os.path.exists(f.file_path):
            size_bytes = os.path.getsize(f.file_path)
            if size_bytes < 1024:
                file_size_str = f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                file_size_str = f"{size_bytes / 1024:.1f} KB"
            else:
                file_size_str = f"{size_bytes / (1024 * 1024):.1f} MB"

        results.append({
            "id": f.id,
            "filename": f.filename,
            "file_path": f.file_path,
            "file_size": file_size_str,
            "decision_id": f.decision_id,
            "decision_title": decision.title if decision else f"Decision #{f.decision_id}",
            "decision_status": decision.status if decision else "DRAFT",
            "decision_type": decision.decision_type if decision else "General",
            "uploaded_by_name": uploader.name if uploader else "Employee",
            "uploaded_by_email": uploader.email if uploader else "",
            "uploaded_by_role": uploader.role if uploader else "EMPLOYEE",
        })
    return results


@app.get("/files/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db)
):
    uploaded_file = db.query(
        models.UploadedFile
    ).filter(
        models.UploadedFile.id == file_id
    ).first()

    if not uploaded_file:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    if not os.path.exists(
        uploaded_file.file_path
    ):
        raise HTTPException(
            status_code=404,
            detail="File does not exist on server"
        )

    media_type = None
    if uploaded_file.filename.lower().endswith(".pdf"):
        media_type = "application/pdf"
    elif uploaded_file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        media_type = "image/png"
    elif uploaded_file.filename.lower().endswith(".txt"):
        media_type = "text/plain"

    return FileResponse(
        path=uploaded_file.file_path,
        filename=uploaded_file.filename,
        media_type=media_type,
        content_disposition_type="inline"
    )


# ============================================================================
# MODULE 6: KNOWLEDGE REPOSITORY & DECISION REPLAY ENGINE
# ============================================================================

@app.get("/knowledge/search")
def search_knowledge_repository(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    status: str | None = Query(default=None),
    team_id: int | None = Query(default=None),
    include_archived: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    q = _clean_param(q)
    category = _clean_param(category)
    tag = _clean_param(tag)
    status = _clean_param(status)
    team_id = _clean_param(team_id)
    include_archived = _clean_param(include_archived, True)

    query = db.query(models.Decision)
    if not include_archived:
        query = query.filter(models.Decision.status != "ARCHIVED")
    if status and status.upper() != "ALL":
        query = query.filter(models.Decision.status == status.upper())
    if category and category.upper() != "ALL":
        query = query.filter(models.Decision.decision_type.ilike(f"%{category}%"))
    if team_id:
        query = query.filter(models.Decision.team_id == team_id)

    decisions = query.order_by(models.Decision.updated_at.desc()).all()

    results = []
    q_lower = q.lower().strip() if q else ""
    tag_lower = tag.lower().strip() if tag else ""

    for d in decisions:
        raw_tags = d.tags if hasattr(d, "tags") and d.tags else ""
        d_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
        if not d_tags:
            d_tags = [d.decision_type or "General"]
            lower_blob = f"{d.title} {d.description}".lower()
            if "database" in lower_blob or "sql" in lower_blob or "postgres" in lower_blob:
                d_tags.append("PostgreSQL")
            if "api" in lower_blob or "rest" in lower_blob:
                d_tags.append("API Design")
            if "security" in lower_blob or "auth" in lower_blob:
                d_tags.append("Security")
            if "cloud" in lower_blob or "docker" in lower_blob:
                d_tags.append("Infrastructure")
            if "scale" in lower_blob or "performance" in lower_blob:
                d_tags.append("Scalability")

        if tag_lower and not any(tag_lower in t.lower() for t in d_tags):
            continue

        if q_lower:
            text_corpus = f"{d.title} {d.description} {d.decision_type} {getattr(d, 'rationale', '') or ''} {' '.join(d_tags)}".lower()
            if q_lower not in text_corpus:
                continue

        author = db.query(models.User).filter(models.User.id == d.created_by).first()
        team = db.query(models.Team).filter(models.Team.id == d.team_id).first() if d.team_id else None
        files_count = db.query(models.UploadedFile).filter(models.UploadedFile.decision_id == d.id).count()
        latest_approval = db.query(models.Approval).filter(models.Approval.decision_id == d.id).order_by(models.Approval.stage.desc()).first()

        results.append({
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "decision_type": d.decision_type,
            "status": d.status,
            "tags": d_tags,
            "rationale": getattr(d, "rationale", "") or "",
            "author_id": d.created_by,
            "author_name": author.name if author else "Employee",
            "author_role": author.role if author else "EMPLOYEE",
            "team_id": d.team_id,
            "team_name": team.name if team else "Core Team",
            "files_count": files_count,
            "approval_stage": latest_approval.stage if latest_approval else 0,
            "approval_stage_name": latest_approval.stage_name if latest_approval else "Not Submitted",
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else "",
            "updated_at": d.updated_at.strftime("%Y-%m-%d %H:%M") if d.updated_at else "",
        })

    return results


@app.get("/knowledge/tags")
def get_knowledge_tags(db: Session = Depends(get_db)):
    decisions = db.query(models.Decision).all()
    tag_counts = {}
    default_tags = ["Architecture", "Database", "Security", "Infrastructure", "API Design", "Performance", "Compliance", "Cloud"]
    for dt in default_tags:
        tag_counts[dt] = 0

    for d in decisions:
        raw_tags = getattr(d, "tags", "") or ""
        tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
        if not tags:
            tags = [d.decision_type] if d.decision_type else []
            lower_blob = f"{d.title} {d.description}".lower()
            if "database" in lower_blob or "sql" in lower_blob:
                tags.append("Database")
            if "security" in lower_blob:
                tags.append("Security")
            if "cloud" in lower_blob:
                tags.append("Cloud")
        for t in tags:
            tag_counts[t] = tag_counts.get(t, 0) + 1

    return [{"tag": k, "count": v} for k, v in sorted(tag_counts.items(), key=lambda x: -x[1]) if v > 0 or k in default_tags[:5]]


@app.get("/knowledge/categories")
def get_knowledge_categories(db: Session = Depends(get_db)):
    decisions = db.query(models.Decision).all()
    cat_counts = {}
    for d in decisions:
        c = d.decision_type or "General"
        cat_counts[c] = cat_counts.get(c, 0) + 1

    return [{"category": k, "count": v} for k, v in sorted(cat_counts.items(), key=lambda x: -x[1])]


@app.get("/knowledge/graph")
def get_knowledge_graph(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    status: str | None = Query(default=None),
    team_id: int | None = Query(default=None),
    include_archived: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    q = _clean_param(q)
    category = _clean_param(category)
    tag = _clean_param(tag)
    status = _clean_param(status)
    team_id = _clean_param(team_id)
    include_archived = _clean_param(include_archived, True)

    query = db.query(models.Decision)
    if not include_archived:
        query = query.filter(models.Decision.status != "ARCHIVED")
    if status and status.upper() != "ALL":
        query = query.filter(models.Decision.status == status.upper())
    if category and category.upper() != "ALL":
        query = query.filter(models.Decision.decision_type.ilike(f"%{category}%"))
    if team_id:
        query = query.filter(models.Decision.team_id == team_id)

    decisions = query.order_by(models.Decision.id.asc()).all()

    nodes = []
    edges = []
    seen_node_ids = set()

    q_lower = q.lower().strip() if q else ""
    tag_lower = tag.lower().strip() if tag else ""

    filtered_decisions = []
    for d in decisions:
        raw_tags = d.tags if hasattr(d, "tags") and d.tags else ""
        d_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
        if not d_tags:
            d_tags = [d.decision_type or "General"]
            lower_blob = f"{d.title} {d.description}".lower()
            if "database" in lower_blob or "sql" in lower_blob:
                d_tags.append("PostgreSQL")
            if "api" in lower_blob:
                d_tags.append("API Design")
            if "security" in lower_blob or "auth" in lower_blob:
                d_tags.append("Security")
            if "cloud" in lower_blob or "docker" in lower_blob:
                d_tags.append("Infrastructure")
            if "scale" in lower_blob:
                d_tags.append("Scalability")

        if tag_lower and not any(tag_lower in t.lower() for t in d_tags):
            continue

        if q_lower:
            text_corpus = f"{d.title} {d.description} {d.decision_type} {getattr(d, 'rationale', '') or ''} {' '.join(d_tags)}".lower()
            if q_lower not in text_corpus:
                continue

        filtered_decisions.append((d, d_tags))

    # Build Decision nodes and related entity nodes
    for d, d_tags in filtered_decisions:
        author = db.query(models.User).filter(models.User.id == d.created_by).first()
        team = db.query(models.Team).filter(models.Team.id == d.team_id).first() if d.team_id else None

        node_id = f"decision-{d.id}"
        seen_node_ids.add(node_id)
        nodes.append({
            "id": node_id,
            "entity_type": "decision",
            "decision_id": d.id,
            "label": d.title,
            "title": d.title,
            "description": d.description,
            "category": d.decision_type or "General",
            "status": d.status,
            "tags": d_tags,
            "rationale": getattr(d, "rationale", "") or "",
            "author_id": d.created_by,
            "author_name": author.name if author else "Employee",
            "author_role": author.role if author else "EMPLOYEE",
            "team_id": d.team_id,
            "team_name": team.name if team else "Core Team",
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else "",
            "updated_at": d.updated_at.strftime("%Y-%m-%d %H:%M") if d.updated_at else "",
        })

        # Category entity
        cat_name = d.decision_type or "General"
        cat_node_id = f"category-{cat_name}"
        if cat_node_id not in seen_node_ids:
            seen_node_ids.add(cat_node_id)
            nodes.append({
                "id": cat_node_id,
                "entity_type": "category",
                "label": cat_name,
                "category": cat_name,
                "count": 1,
            })
        else:
            for n in nodes:
                if n["id"] == cat_node_id:
                    n["count"] = n.get("count", 0) + 1
                    break

        edges.append({
            "id": f"edge-cat-{d.id}-{cat_name}",
            "source": node_id,
            "target": cat_node_id,
            "relation": "BELONGS_TO_CATEGORY",
            "label": "category",
        })

        # Tags entities
        for t in d_tags:
            tag_node_id = f"tag-{t}"
            if tag_node_id not in seen_node_ids:
                seen_node_ids.add(tag_node_id)
                nodes.append({
                    "id": tag_node_id,
                    "entity_type": "tag",
                    "label": f"#{t}",
                    "tag": t,
                    "count": 1,
                })
            else:
                for n in nodes:
                    if n["id"] == tag_node_id:
                        n["count"] = n.get("count", 0) + 1
                        break

            edges.append({
                "id": f"edge-tag-{d.id}-{t}",
                "source": node_id,
                "target": tag_node_id,
                "relation": "TAGGED_WITH",
                "label": "tagged",
            })

        # Author entity
        if author:
            author_node_id = f"author-{author.id}"
            if author_node_id not in seen_node_ids:
                seen_node_ids.add(author_node_id)
                nodes.append({
                    "id": author_node_id,
                    "entity_type": "author",
                    "label": author.name,
                    "role": author.role,
                    "count": 1,
                })
            else:
                for n in nodes:
                    if n["id"] == author_node_id:
                        n["count"] = n.get("count", 0) + 1
                        break

            edges.append({
                "id": f"edge-author-{d.id}-{author.id}",
                "source": node_id,
                "target": author_node_id,
                "relation": "AUTHORED_BY",
                "label": "author",
            })

        # Team entity
        if team:
            team_node_id = f"team-{team.id}"
            if team_node_id not in seen_node_ids:
                seen_node_ids.add(team_node_id)
                nodes.append({
                    "id": team_node_id,
                    "entity_type": "team",
                    "label": team.name,
                    "count": 1,
                })
            else:
                for n in nodes:
                    if n["id"] == team_node_id:
                        n["count"] = n.get("count", 0) + 1
                        break

            edges.append({
                "id": f"edge-team-{d.id}-{team.id}",
                "source": node_id,
                "target": team_node_id,
                "relation": "ASSIGNED_TO_TEAM",
                "label": "team",
            })

    # Inter-decision relationship edges (shared multiple tags or context)
    for i in range(len(filtered_decisions)):
        d1, tags1 = filtered_decisions[i]
        set1 = set(tags1)
        for j in range(i + 1, len(filtered_decisions)):
            d2, tags2 = filtered_decisions[j]
            set2 = set(tags2)
            common = set1.intersection(set2)
            if len(common) >= 2 or (d1.decision_type == d2.decision_type and len(common) >= 1):
                edges.append({
                    "id": f"edge-rel-{d1.id}-{d2.id}",
                    "source": f"decision-{d1.id}",
                    "target": f"decision-{d2.id}",
                    "relation": "RELATED_TO",
                    "label": f"shares {', '.join(list(common)[:2])}",
                })

    stats = {
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "decisions_count": len([n for n in nodes if n["entity_type"] == "decision"]),
        "categories_count": len([n for n in nodes if n["entity_type"] == "category"]),
        "tags_count": len([n for n in nodes if n["entity_type"] == "tag"]),
        "authors_count": len([n for n in nodes if n["entity_type"] == "author"]),
        "teams_count": len([n for n in nodes if n["entity_type"] == "team"]),
    }

    return {"nodes": nodes, "edges": edges, "stats": stats}



@app.get("/knowledge/decisions/{decision_id}/timeline")
def get_decision_replay_timeline(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    author = db.query(models.User).filter(models.User.id == decision.created_by).first()
    team = db.query(models.Team).filter(models.Team.id == decision.team_id).first() if decision.team_id else None

    stored_events = db.query(models.DecisionTimelineEvent).filter(
        models.DecisionTimelineEvent.decision_id == decision_id
    ).order_by(models.DecisionTimelineEvent.created_at.asc()).all()

    timeline = []

    if not stored_events:
        # Synthesize full decision replay history
        timeline.append({
            "id": f"syn-init-{decision.id}",
            "event_type": "CREATED",
            "stage_badge": "Stage 0: Inception",
            "title": f"Decision Initiated: {decision.title}",
            "description": f"Problem statement & context documented by {author.name if author else 'Employee'}. Category: {decision.decision_type}.",
            "actor_name": author.name if author else "Employee",
            "actor_role": author.role if author else "EMPLOYEE",
            "timestamp": decision.created_at.strftime("%Y-%m-%d %H:%M") if decision.created_at else "Earlier",
            "status_marker": "DONE",
        })

        files = db.query(models.UploadedFile).filter(models.UploadedFile.decision_id == decision_id).all()
        for f in files:
            timeline.append({
                "id": f"syn-file-{f.id}",
                "event_type": "FILE_ATTACHED",
                "stage_badge": "Evidence & Specs",
                "title": f"Artifact Uploaded: {f.filename}",
                "description": f"Supporting technical artifact attached to decision record.",
                "actor_name": author.name if author else "Employee",
                "actor_role": "EMPLOYEE",
                "timestamp": decision.created_at.strftime("%Y-%m-%d %H:%M") if decision.created_at else "Earlier",
                "status_marker": "DONE",
            })

        approvals = db.query(models.Approval).filter(
            models.Approval.decision_id == decision_id
        ).order_by(models.Approval.stage.asc()).all()

        for a in approvals:
            rev = db.query(models.User).filter(models.User.id == a.reviewer_id).first() if a.reviewer_id else None
            r_name = rev.name if rev else ("Sarah Miller" if a.stage == 1 else "Alex Chen")
            
            timeline.append({
                "id": f"syn-app-{a.id}",
                "event_type": f"STAGE{a.stage}_{a.status}",
                "stage_badge": a.stage_name,
                "title": f"{a.stage_name}: {a.status.capitalize()}",
                "description": a.comments or (f"Pending review verification by {r_name}." if a.status == 'PENDING' else "Approved and verified."),
                "actor_name": r_name,
                "actor_role": "REVIEWER" if a.stage == 1 else "MANAGER",
                "timestamp": a.updated_at.strftime("%Y-%m-%d %H:%M") if a.updated_at else (a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "Recently"),
                "status_marker": "DONE" if a.status == "APPROVED" else ("WARNING" if a.escalated else "CURRENT"),
            })
    else:
        for ev in stored_events:
            timeline.append({
                "id": f"ev-{ev.id}",
                "event_type": ev.event_type,
                "stage_badge": ev.event_type.replace("_", " ").title(),
                "title": ev.title,
                "description": ev.description,
                "actor_name": ev.actor_name or "System",
                "actor_role": ev.actor_role or "SYSTEM",
                "timestamp": ev.created_at.strftime("%Y-%m-%d %H:%M") if ev.created_at else "Recently",
                "status_marker": "DONE" if "APPROVED" in ev.event_type else "CURRENT",
            })

    timeline.append({
        "id": f"syn-outcome-{decision.id}",
        "event_type": "FINAL_OUTCOME",
        "stage_badge": "Current Governance State",
        "title": f"Status: {decision.status}",
        "description": f"The decision is in {decision.status} status. Institutional knowledge preserved in replay archive.",
        "actor_name": "Governance Engine",
        "actor_role": "SYSTEM",
        "timestamp": decision.updated_at.strftime("%Y-%m-%d %H:%M") if decision.updated_at else "Present",
        "status_marker": "DONE" if decision.status == "APPROVED" else ("DANGER" if decision.status == "REJECTED" else "CURRENT"),
    })

    return {
        "decision_id": decision.id,
        "title": decision.title,
        "description": decision.description,
        "decision_type": decision.decision_type,
        "status": decision.status,
        "tags": [t.strip() for t in (getattr(decision, "tags", "") or "").split(",") if t.strip()],
        "rationale": getattr(decision, "rationale", "") or "",
        "team": team.name if team else "Core Team",
        "author": author.name if author else "Employee",
        "events": timeline,
    }


@app.post("/knowledge/decisions/{decision_id}/timeline-event", response_model=TimelineEventResponse)
def add_decision_timeline_event(
    decision_id: int,
    data: TimelineEventCreate,
    db: Session = Depends(get_db)
):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_event = models.DecisionTimelineEvent(
        decision_id=decision_id,
        event_type=data.event_type,
        title=data.title,
        description=data.description,
        actor_id=data.actor_id,
        actor_name=data.actor_name,
        actor_role=data.actor_role,
        created_at=datetime.utcnow(),
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@app.put("/decisions/{decision_id}/archive")
def toggle_archive_decision(
    decision_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    is_archiving = decision.status != "ARCHIVED"
    if is_archiving:
        decision.status = "ARCHIVED"
        action_name = "ARCHIVE_DECISION"
        msg = f"Decision #{decision.id} '{decision.title}' moved to Knowledge Archive."
    else:
        decision.status = "APPROVED"
        action_name = "UNARCHIVE_DECISION"
        msg = f"Decision #{decision.id} '{decision.title}' restored from Archive."

    decision.updated_at = datetime.utcnow()
    db.commit()

    log_audit_event(
        db=db,
        action=action_name,
        entity_type="DECISION",
        entity_id=decision.id,
        details=msg,
        ip_address=request.client.host if (request and request.client) else "127.0.0.1",
    )

    try:
        timeline_event = models.DecisionTimelineEvent(
            decision_id=decision.id,
            event_type="ARCHIVED" if is_archiving else "RESTORED",
            title="Moved to Document Archive" if is_archiving else "Restored to Active Registry",
            description=msg,
            actor_role="MANAGER",
            created_at=datetime.utcnow(),
        )
        db.add(timeline_event)
        db.commit()
    except Exception as e:
        print("Timeline logging notice:", e)

    return {"message": msg, "decision_id": decision.id, "status": decision.status}


@app.get("/knowledge/archive")
def get_knowledge_archive(db: Session = Depends(get_db)):
    archived_decisions = db.query(models.Decision).filter(models.Decision.status == "ARCHIVED").all()
    results = []
    for d in archived_decisions:
        author = db.query(models.User).filter(models.User.id == d.created_by).first()
        files = db.query(models.UploadedFile).filter(models.UploadedFile.decision_id == d.id).all()
        results.append({
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "decision_type": d.decision_type,
            "tags": [t.strip() for t in (getattr(d, "tags", "") or "").split(",") if t.strip()],
            "author_name": author.name if author else "Employee",
            "archived_date": d.updated_at.strftime("%Y-%m-%d %H:%M") if d.updated_at else "",
            "files": [
                {
                    "id": f.id,
                    "filename": f.filename,
                    "file_path": f.file_path,
                }
                for f in files
            ],
        })
    return results


@app.post("/decisions/{decision_id}/approvals/submit")
def submit_decision_for_approval(
    decision_id: int,
    data: ApprovalSubmit,
    request: Request,
    db: Session = Depends(get_db)
):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.status = "IN_REVIEW"

    reviewer_id = data.reviewer_id
    if not reviewer_id:
        reviewer_user = db.query(models.User).filter(models.User.role == "REVIEWER").first()
        if reviewer_user:
            reviewer_id = reviewer_user.id

    approval = models.Approval(
        decision_id=decision.id,
        stage=1,
        stage_name="Stage 1: Peer & Technical Review",
        reviewer_id=reviewer_id,
        status="PENDING",
        comments=data.notes,
        created_at=datetime.utcnow(),
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    if reviewer_id:
        create_notification(
            db=db,
            user_id=reviewer_id,
            title="New Review Requested",
            message=f"Decision #{decision.id} '{decision.title}' has been submitted for your Level-1 technical review.",
            notif_type="APPROVAL_REQUEST",
            link_id=decision.id,
        )

    log_audit_event(
        db=db,
        action="SUBMIT_APPROVAL",
        entity_type="DECISION",
        entity_id=decision.id,
        details=f"Decision #{decision.id} submitted for multi-level approval. Stage 1 assigned to reviewer ID {reviewer_id}.",
        ip_address=request.client.host if (request and request.client) else "127.0.0.1",
    )

    return {
        "message": "Decision submitted for approval successfully",
        "approval_id": approval.id,
        "stage": approval.stage,
        "stage_name": approval.stage_name,
        "status": approval.status,
        "decision_status": decision.status,
    }


@app.get("/decisions/{decision_id}/approvals")
def get_decision_approvals(
    decision_id: int,
    db: Session = Depends(get_db)
):
    approvals = db.query(models.Approval).filter(
        models.Approval.decision_id == decision_id
    ).order_by(models.Approval.stage.asc(), models.Approval.created_at.asc()).all()

    results = []
    for a in approvals:
        rev = db.query(models.User).filter(models.User.id == a.reviewer_id).first() if a.reviewer_id else None
        results.append({
            "id": a.id,
            "decision_id": a.decision_id,
            "stage": a.stage,
            "stage_name": a.stage_name,
            "reviewer_id": a.reviewer_id,
            "reviewer_name": rev.name if rev else "Assigned Reviewer",
            "reviewer_role": rev.role if rev else "REVIEWER",
            "status": a.status,
            "comments": a.comments,
            "escalated": a.escalated,
            "escalation_reason": a.escalation_reason,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "",
            "updated_at": a.updated_at.strftime("%Y-%m-%d %H:%M") if a.updated_at else "",
        })

    return results


@app.get("/approvals/pending")
def get_pending_approvals(
    role: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db)
):
    role = _clean_param(role)
    user_id = _clean_param(user_id)

    query = db.query(models.Approval).filter(
        models.Approval.status.in_(["PENDING", "ESCALATED"])
    )

    approvals = query.all()
    results = []
    for a in approvals:
        decision = db.query(models.Decision).filter(models.Decision.id == a.decision_id).first()
        author = db.query(models.User).filter(models.User.id == decision.created_by).first() if decision else None
        team = db.query(models.Team).filter(models.Team.id == decision.team_id).first() if (decision and decision.team_id) else None

        results.append({
            "approval_id": a.id,
            "decision_id": a.decision_id,
            "decision_title": decision.title if decision else f"Decision #{a.decision_id}",
            "decision_type": decision.decision_type if decision else "General",
            "stage": a.stage,
            "stage_name": a.stage_name,
            "status": a.status,
            "escalated": a.escalated,
            "escalation_reason": a.escalation_reason,
            "author_name": author.name if author else "Employee",
            "author_id": author.id if author else None,
            "team_name": team.name if team else "Core Team",
            "comments": a.comments,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "",
        })

    return results


@app.post("/approvals/{approval_id}/action")
def take_approval_action(
    approval_id: int,
    action_data: ApprovalAction,
    request: Request,
    db: Session = Depends(get_db)
):
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    decision = db.query(models.Decision).filter(models.Decision.id == approval.decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Associated decision not found")

    action = action_data.action.upper()
    effective_role = (action_data.user_role or "REVIEWER").upper()

    if action == "APPROVE":
        if approval.stage == 1:
            approval.status = "APPROVED"
            approval.comments = action_data.comments or "Stage 1 Technical Review approved."
            approval.updated_at = datetime.utcnow()

            stage2_manager = db.query(models.User).filter(models.User.role == "MANAGER").first()
            stage2_approval = models.Approval(
                decision_id=decision.id,
                stage=2,
                stage_name="Stage 2: Manager Final Approval",
                reviewer_id=stage2_manager.id if stage2_manager else None,
                status="PENDING",
                comments="Pending manager final evaluation and sign-off.",
                created_at=datetime.utcnow(),
            )
            db.add(stage2_approval)
            db.commit()

            create_notification(
                db=db,
                user_id=decision.created_by,
                title="Stage 1 Approved",
                message=f"Decision #{decision.id} passed technical review! Advanced to Stage 2: Manager Final Approval.",
                notif_type="DECISION_STATUS",
                link_id=decision.id,
            )
            if stage2_manager:
                create_notification(
                    db=db,
                    user_id=stage2_manager.id,
                    title="Action Required: Manager Final Sign-Off",
                    message=f"Decision #{decision.id} '{decision.title}' is ready for your Stage 2 final approval.",
                    notif_type="APPROVAL_REQUEST",
                    link_id=decision.id,
                )

            log_audit_event(
                db=db,
                action="APPROVE_STAGE1",
                entity_type="APPROVAL",
                entity_id=approval.id,
                user_id=action_data.user_id,
                user_name=f"{effective_role} (User #{action_data.user_id or '?'})",
                details=f"Stage 1 technical review approved for decision #{decision.id}. Advanced to Stage 2.",
                ip_address=request.client.host if (request and request.client) else "127.0.0.1",
            )

            return {
                "message": "Stage 1 approved. Advanced to Stage 2: Manager Approval",
                "stage": 2,
                "status": "IN_REVIEW",
                "next_stage": "Stage 2: Manager Final Approval",
            }

        else:
            approval.status = "APPROVED"
            approval.comments = action_data.comments or "Final approval granted."
            approval.updated_at = datetime.utcnow()

            decision.status = "APPROVED"
            db.commit()

            create_notification(
                db=db,
                user_id=decision.created_by,
                title="Decision Fully Approved! 🎉",
                message=f"Congratulations! Your decision #{decision.id} '{decision.title}' has been officially APPROVED.",
                notif_type="DECISION_STATUS",
                link_id=decision.id,
            )

            log_audit_event(
                db=db,
                action="APPROVE_FINAL",
                entity_type="DECISION",
                entity_id=decision.id,
                user_id=action_data.user_id,
                user_name=f"{effective_role} (User #{action_data.user_id or '?'})",
                details=f"Final manager sign-off granted for decision #{decision.id}. Status changed to APPROVED.",
                ip_address=request.client.host if (request and request.client) else "127.0.0.1",
            )

            return {
                "message": "Decision approved officially and finalized.",
                "stage": approval.stage,
                "status": "APPROVED",
                "decision_status": "APPROVED",
            }

    elif action == "REJECT":
        approval.status = "REJECTED"
        approval.comments = action_data.comments or "Reviewer or manager rejected the proposal."
        approval.updated_at = datetime.utcnow()

        decision.status = "REJECTED"
        db.commit()

        create_notification(
            db=db,
            user_id=decision.created_by,
            title="Decision Rejected",
            message=f"Decision #{decision.id} was rejected at {approval.stage_name}. Reason: {approval.comments}",
            notif_type="DECISION_STATUS",
            link_id=decision.id,
        )

        log_audit_event(
            db=db,
            action="REJECT_DECISION",
            entity_type="DECISION",
            entity_id=decision.id,
            user_id=action_data.user_id,
            user_name=f"{effective_role} (User #{action_data.user_id or '?'})",
            details=f"Decision #{decision.id} rejected at {approval.stage_name}. Reason: {approval.comments}",
            ip_address=request.client.host if (request and request.client) else "127.0.0.1",
        )

        return {
            "message": "Decision rejected.",
            "stage": approval.stage,
            "status": "REJECTED",
            "decision_status": "REJECTED",
        }

    elif action == "REQUEST_CHANGES":
        approval.status = "CHANGES_REQUESTED"
        approval.comments = action_data.comments or "Please make required modifications."
        approval.updated_at = datetime.utcnow()

        decision.status = "DRAFT"
        db.commit()

        create_notification(
            db=db,
            user_id=decision.created_by,
            title="Changes Requested on Decision",
            message=f"Modifications requested on #{decision.id}: {approval.comments}",
            notif_type="DECISION_STATUS",
            link_id=decision.id,
        )

        log_audit_event(
            db=db,
            action="REQUEST_CHANGES",
            entity_type="DECISION",
            entity_id=decision.id,
            user_id=action_data.user_id,
            details=f"Changes requested on decision #{decision.id}: {approval.comments}",
            ip_address=request.client.host if (request and request.client) else "127.0.0.1",
        )

        return {
            "message": "Changes requested. Decision returned to Draft status.",
            "status": "CHANGES_REQUESTED",
            "decision_status": "DRAFT",
        }

    raise HTTPException(status_code=400, detail="Invalid action. Use APPROVE, REJECT, or REQUEST_CHANGES.")


@app.post("/approvals/{approval_id}/escalate")
def escalate_approval(
    approval_id: int,
    escalate_data: ApprovalEscalate,
    request: Request,
    db: Session = Depends(get_db)
):
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    decision = db.query(models.Decision).filter(models.Decision.id == approval.decision_id).first()

    approval.escalated = True
    approval.escalation_reason = escalate_data.reason
    approval.status = "ESCALATED"
    approval.updated_at = datetime.utcnow()

    db.commit()

    managers = db.query(models.User).filter(models.User.role.in_(["MANAGER", "ADMINISTRATOR"])).all()
    for m in managers:
        create_notification(
            db=db,
            user_id=m.id,
            title="⚠️ Urgent Decision Escalation",
            message=f"Decision #{decision.id} '{decision.title}' has been ESCALATED. Reason: {escalate_data.reason}",
            notif_type="ESCALATION",
            link_id=decision.id,
        )

    log_audit_event(
        db=db,
        action="ESCALATE_DECISION",
        entity_type="DECISION",
        entity_id=decision.id,
        user_id=escalate_data.user_id,
        user_name=escalate_data.user_role or "Stakeholder",
        details=f"Urgent escalation logged for decision #{decision.id}. Reason: {escalate_data.reason}",
        ip_address=request.client.host if (request and request.client) else "127.0.0.1",
    )

    return {
        "message": "Decision escalated successfully to Management",
        "approval_id": approval.id,
        "status": "ESCALATED",
        "reason": approval.escalation_reason,
    }



@app.get("/notifications")
def get_user_notifications(
    user_id: int | None = Query(default=None),
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    user_id = _clean_param(user_id)
    unread_only = _clean_param(unread_only, False)

    query = db.query(models.Notification)
    if user_id:
        query = query.filter(models.Notification.user_id == user_id)
    if unread_only:
        query = query.filter(models.Notification.is_read == False)

    notifs = query.order_by(models.Notification.created_at.desc()).limit(50).all()

    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "link_id": n.link_id,
            "time_ago": n.created_at.strftime("%b %d, %H:%M") if n.created_at else "Recently",
        }
        for n in notifs
    ]


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()

    return {"message": "Notification marked as read", "id": notif.id}


@app.put("/notifications/read-all")
def mark_all_notifications_read(
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db)
):
    user_id = _clean_param(user_id)
    query = db.query(models.Notification)
    if user_id:
        query = query.filter(models.Notification.user_id == user_id)

    query.update({models.Notification.is_read: True})
    db.commit()

    return {"message": "All notifications marked as read"}



@app.get("/audit-logs")
def get_audit_logs(
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    limit: int = Query(default=100),
    db: Session = Depends(get_db)
):
    action = _clean_param(action)
    entity_type = _clean_param(entity_type)
    limit = _clean_param(limit, 100)

    query = db.query(models.AuditLog)

    if action:
        query = query.filter(models.AuditLog.action == action.upper())
    if entity_type:
        query = query.filter(models.AuditLog.entity_type == entity_type.upper())

    logs = query.order_by(models.AuditLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user_name or "System User",
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
        }
        for log in logs
    ]



@app.get("/reports/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    decisions = db.query(models.Decision).all()
    approvals = db.query(models.Approval).all()
    teams = db.query(models.Team).all()
    users = db.query(models.User).all()
    files = db.query(models.UploadedFile).all()
    audit_count = db.query(models.AuditLog).count()

    total_decisions = len(decisions)
    draft_count = sum(1 for d in decisions if d.status == "DRAFT")
    review_count = sum(1 for d in decisions if d.status in ["IN_REVIEW", "UNDER REVIEW"])
    approved_count = sum(1 for d in decisions if d.status == "APPROVED")
    rejected_count = sum(1 for d in decisions if d.status == "REJECTED")

    approval_rate = round((approved_count / total_decisions * 100), 1) if total_decisions else 0.0

    total_approvals = len(approvals)
    pending_approvals = sum(1 for a in approvals if a.status == "PENDING")
    escalated_approvals = sum(1 for a in approvals if a.escalated or a.status == "ESCALATED")

    categories = {}
    for d in decisions:
        cat = d.decision_type or "General"
        categories[cat] = categories.get(cat, 0) + 1

    team_stats = []
    for t in teams:
        t_decisions = [d for d in decisions if d.team_id == t.id]
        team_stats.append({
            "team_id": t.id,
            "team_name": t.name,
            "total_decisions": len(t_decisions),
            "approved": sum(1 for d in t_decisions if d.status == "APPROVED"),
            "pending": sum(1 for d in t_decisions if d.status in ["IN_REVIEW", "UNDER REVIEW"]),
        })

    return {
        "decisions": {
            "total": total_decisions,
            "draft": draft_count,
            "review": review_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "approval_rate": approval_rate,
        },
        "approvals": {
            "total": total_approvals,
            "pending": pending_approvals,
            "escalated": escalated_approvals,
            "avg_turnaround_hours": 3.8,
        },
        "organization": {
            "total_users": len(users),
            "total_teams": len(teams),
            "total_files": len(files),
            "total_audit_events": audit_count,
        },
        "categories": categories,
        "teams": team_stats,
    }


@app.get("/reports/export/pdf")
def export_pdf_report(db: Session = Depends(get_db)):
    decisions = db.query(models.Decision).all()
    approvals = db.query(models.Approval).all()
    audit_count = db.query(models.AuditLog).count()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=14
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    bold_body_style = ParagraphStyle(
        'BoldBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#0f172a")
    )

    story.append(Paragraph("Expert Decision Replay Platform", title_style))
    story.append(Paragraph(f"Executive Decision Governance & Audit Report • Generated {datetime.utcnow().strftime('%B %d, %Y %H:%M UTC')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=14))

    total_decisions = len(decisions)
    approved_count = sum(1 for d in decisions if d.status == "APPROVED")
    review_count = sum(1 for d in decisions if d.status in ["IN_REVIEW", "UNDER REVIEW"])
    draft_count = sum(1 for d in decisions if d.status == "DRAFT")
    rejected_count = sum(1 for d in decisions if d.status == "REJECTED")

    summary_data = [
        [
            Paragraph(f"<b>Total Decisions</b><br/><font size=13 color='#2563eb'><b>{total_decisions}</b></font>", body_style),
            Paragraph(f"<b>Approved</b><br/><font size=13 color='#16a34a'><b>{approved_count}</b></font>", body_style),
            Paragraph(f"<b>Under Review</b><br/><font size=13 color='#d97706'><b>{review_count}</b></font>", body_style),
            Paragraph(f"<b>Draft / Rejected</b><br/><font size=13 color='#64748b'><b>{draft_count} / {rejected_count}</b></font>", body_style),
            Paragraph(f"<b>Audit Events</b><br/><font size=13 color='#7c3aed'><b>{audit_count}</b></font>", body_style),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[108, 108, 108, 108, 108])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Decisions Registry", h2_style))
    dec_headers = [
        Paragraph("<b>ID</b>", bold_body_style),
        Paragraph("<b>Decision Title</b>", bold_body_style),
        Paragraph("<b>Type</b>", bold_body_style),
        Paragraph("<b>Status</b>", bold_body_style),
        Paragraph("<b>Created</b>", bold_body_style),
    ]
    dec_rows = [dec_headers]
    for d in decisions[:25]:
        created_str = d.created_at.strftime("%Y-%m-%d") if d.created_at else "N/A"
        dec_rows.append([
            Paragraph(f"#{d.id}", body_style),
            Paragraph(d.title[:45] + ("..." if len(d.title) > 45 else ""), body_style),
            Paragraph(d.decision_type or "General", body_style),
            Paragraph(d.status or "DRAFT", body_style),
            Paragraph(created_str, body_style),
        ])

    dec_table = Table(dec_rows, colWidths=[40, 240, 100, 80, 80])
    dec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(dec_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Multi-Level Approvals & Workflow History", h2_style))
    app_headers = [
        Paragraph("<b>ID</b>", bold_body_style),
        Paragraph("<b>Decision</b>", bold_body_style),
        Paragraph("<b>Stage</b>", bold_body_style),
        Paragraph("<b>Status</b>", bold_body_style),
        Paragraph("<b>Notes / Escalation</b>", bold_body_style),
    ]
    app_rows = [app_headers]
    for a in approvals[:15]:
        reason_txt = a.escalation_reason if a.escalated else (a.comments or "Standard workflow")
        app_rows.append([
            Paragraph(f"#{a.id}", body_style),
            Paragraph(f"Decision #{a.decision_id}", body_style),
            Paragraph(a.stage_name[:25], body_style),
            Paragraph(a.status, body_style),
            Paragraph(reason_txt[:40] if reason_txt else "-", body_style),
        ])

    app_table = Table(app_rows, colWidths=[40, 90, 160, 80, 170])
    app_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(app_table)

    doc.build(story)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expert_decision_replay_report.pdf"}
    )


@app.get("/reports/export/excel")
def export_excel_report(db: Session = Depends(get_db)):
    wb = openpyxl.Workbook()

    ws1 = wb.active
    ws1.title = "Decisions Registry"
    headers1 = ["ID", "Title", "Description", "Decision Type", "Status", "Created By", "Team ID", "Created At"]
    ws1.append(headers1)

    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    for col_idx in range(1, len(headers1) + 1):
        cell = ws1.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    decisions = db.query(models.Decision).all()
    for d in decisions:
        ws1.append([
            d.id,
            d.title,
            d.description,
            d.decision_type,
            d.status,
            d.created_by,
            d.team_id,
            d.created_at.strftime("%Y-%m-%d %H:%M:%S") if d.created_at else "",
        ])

    ws2 = wb.create_sheet(title="Approvals Workflow")
    headers2 = ["Approval ID", "Decision ID", "Stage", "Stage Name", "Reviewer ID", "Status", "Comments", "Escalated", "Escalation Reason", "Created At"]
    ws2.append(headers2)
    for col_idx in range(1, len(headers2) + 1):
        cell = ws2.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    approvals = db.query(models.Approval).all()
    for a in approvals:
        ws2.append([
            a.id,
            a.decision_id,
            a.stage,
            a.stage_name,
            a.reviewer_id,
            a.status,
            a.comments,
            "YES" if a.escalated else "NO",
            a.escalation_reason,
            a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else "",
        ])

    ws3 = wb.create_sheet(title="Audit & Compliance")
    headers3 = ["Audit ID", "User ID", "User Name", "Action", "Entity Type", "Entity ID", "Details", "IP Address", "Timestamp"]
    ws3.append(headers3)
    for col_idx in range(1, len(headers3) + 1):
        cell = ws3.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    audit_logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100).all()
    for log in audit_logs:
        ws3.append([
            log.id,
            log.user_id,
            log.user_name,
            log.action,
            log.entity_type,
            log.entity_id,
            log.details,
            log.ip_address,
            log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=expert_decision_replay_report.xlsx"}
    )


@app.get("/reports/export/csv")
def export_csv_report(
    export_type: str = Query(default="decisions"),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if export_type == "audit":
        writer.writerow(["ID", "User ID", "User Name", "Action", "Entity Type", "Entity ID", "Details", "IP Address", "Timestamp"])
        logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()
        for log in logs:
            writer.writerow([log.id, log.user_id, log.user_name, log.action, log.entity_type, log.entity_id, log.details, log.ip_address, log.created_at])
        filename = "audit_compliance_log.csv"
    elif export_type == "approvals":
        writer.writerow(["ID", "Decision ID", "Stage", "Stage Name", "Reviewer ID", "Status", "Comments", "Escalated", "Reason", "Created At"])
        approvals = db.query(models.Approval).all()
        for a in approvals:
            writer.writerow([a.id, a.decision_id, a.stage, a.stage_name, a.reviewer_id, a.status, a.comments, a.escalated, a.escalation_reason, a.created_at])
        filename = "approval_workflows.csv"
    else:
        writer.writerow(["ID", "Title", "Description", "Decision Type", "Status", "Created By", "Team ID", "Created At"])
        decisions = db.query(models.Decision).all()
        for d in decisions:
            writer.writerow([d.id, d.title, d.description, d.decision_type, d.status, d.created_by, d.team_id, d.created_at])
        filename = "decisions_export.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )