"""Expert Decision Replay Platform - FastAPI application."""

import os
import re
import shutil
import unicodedata
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import (
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db, wait_for_database
from models import (
    Alternative,
    Approval,
    AuditLog,
    Comment,
    Decision,
    DecisionHistory,
    Document,
    Notification,
    Outcome,
    Review,
    User,
)
from schemas import (
    AlternativeCreate,
    AlternativeOut,
    ApprovalDecision,
    CommentCreate,
    CommentOut,
    DecisionCreate,
    DecisionEditUpdate,
    DocumentOut,
    OutcomeCreate,
    OutcomeOut,
    ReviewCreate,
    ReviewOut,
    UserCreate,
    UserLogin,
    UserOut,
    UserRoleUpdate,
)
from security import (
    MANAGER_ROLES,
    hash_password,
    is_hashed,
    is_manager_role,
    normalise_role,
    normalise_role_for_storage,
    verify_password,
)
from tokens import (
    create_access_token,
    decode_access_token,
    env_flag,
    get_signing_secret,
)

# ============================================================
# CONFIGURATION
# ============================================================

UPLOAD_DIR = os.path.abspath(
    os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "uploads"))
)

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(25 * 1024 * 1024)))
UPLOAD_CHUNK_SIZE = 1024 * 1024

BLOCKED_EXTENSIONS = {
    "exe", "dll", "so", "bat", "cmd", "com", "scr", "msi", "jar",
    "sh", "bash", "zsh", "ps1", "vbs", "js", "jsp", "php", "phtml",
    "py", "pyc", "rb", "pl", "cgi", "htaccess", "app", "apk", "deb", "rpm",
}

ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt",
    "md", "rtf", "odt", "ods", "odp", "json", "xml", "html", "htm",
    "png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "ico", "tif", "tiff",
    "mp3", "mp4", "wav", "mov", "avi", "zip", "gz", "tar", "7z",
}


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    if origins:
        return origins

    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


# ============================================================
# APPLICATION LIFETIME
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Fail fast rather than accepting requests we cannot authenticate: a bad
    # signing secret is a deployment error, not something to discover later.
    get_signing_secret()

    database_ready = wait_for_database(
        timeout=int(os.getenv("DB_WAIT_TIMEOUT", "90"))
    )

    if database_ready:
        Base.metadata.create_all(bind=engine)
    else:
        # Start anyway so /health reports the real state instead of the
        # container crash-looping. Every endpoint will fail until the database
        # is reachable, which is the honest outcome for a misconfigured
        # DATABASE_URL. Touching the engine here would raise and abort startup,
        # defeating the point of this branch.
        print(
            "[startup] database is not reachable; serving /health only",
            flush=True,
        )
        yield
        return

    wants_seed = os.getenv("SEED_DEMO_USERS", "false").strip().lower() in {
        "1",
        "true",
        "yes",
    }
    wants_bootstrap = bool((os.getenv("BOOTSTRAP_MANAGER_EMAIL") or "").strip())

    if wants_seed or wants_bootstrap:
        try:
            import seed

            if wants_seed:
                seed.seed()
            elif wants_bootstrap:
                # create_tables() above already ran, so the tables exist.
                db = SessionLocal()
                try:
                    print(
                        f"[startup] bootstrap manager: {seed.bootstrap_manager(db)}",
                        flush=True,
                    )
                finally:
                    db.close()
        except Exception as exc:  # noqa: BLE001 - seeding must not block startup
            print(f"[startup] demo seed failed: {exc}", flush=True)

    yield


app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPERS
# ============================================================

class Principal:
    """Authenticated caller, resolved from a signed access token."""

    __slots__ = ("id", "name", "email", "role")

    def __init__(self, user: User):
        self.id = user.id
        self.name = user.name
        self.email = user.email
        self.role = normalise_role(user.role)

    @property
    def is_manager(self) -> bool:
        return is_manager_role(self.role)


def get_principal(
    authorization: Optional[str] = Header(default=None),
) -> Principal:
    """
    Resolve the caller from their signed access token.

    Identity is never taken from a request parameter or body, so a caller
    cannot act as another user by editing a URL. The token is verified against
    the server signing secret, and the user is re-read from the database on
    every request so role changes and deletions take effect immediately.
    """

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = decode_access_token(token.strip())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    try:
        user_id = int(claims["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed session token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account no longer exists",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return Principal(user)
    finally:
        db.close()


CurrentUser = Depends(get_principal)
DbSession = Depends(get_db)


def require_manager(principal: Principal) -> Principal:
    if not principal.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required",
        )
    return principal


def load_decision(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found",
        )
    return decision


def load_decision_for(principal: Principal, db: Session, decision_id: int) -> Decision:
    """Fetch a decision and enforce owner-or-manager visibility."""

    decision = load_decision(db, decision_id)

    if not principal.is_manager and decision.user_id != principal.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this decision",
        )

    return decision


def can_read_document(principal: Principal, document: Document) -> bool:
    if principal.is_manager:
        return True

    if document.uploaded_by == principal.id:
        return True

    return bool(document.decision and document.decision.user_id == principal.id)


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    decision_id: Optional[int] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        decision_id=decision_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )
    db.add(notification)
    return notification


def log_audit(
    db: Session,
    action: str,
    description: Optional[str] = None,
    user_id: Optional[int] = None,
    user_name: Optional[str] = None,
    user_role: Optional[str] = None,
    decision_id: Optional[int] = None,
) -> Optional[AuditLog]:
    """Create an organizational audit log record."""

    try:
        if user_id and (not user_name or not user_role):
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user_name = user_name or user.name
                user_role = user_role or user.role

        entry = AuditLog(
            user_id=user_id,
            user_name=user_name or "System",
            user_role=user_role or "System",
            action=action,
            decision_id=decision_id,
            description=description,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(entry)
        return entry
    except Exception as exc:  # noqa: BLE001 - auditing must never break a request
        print(f"[audit] failed to record '{action}': {exc}", flush=True)
        return None


def audit_for(
    principal: Optional[Principal],
    action: str,
    description: str,
    decision_id: Optional[int] = None,
) -> dict:
    return {
        "user_id": principal.id if principal else None,
        "user_name": principal.name if principal else None,
        "user_role": principal.role if principal else None,
        "action": action,
        "description": description,
        "decision_id": decision_id,
    }


def safe_filename(raw: Optional[str]) -> str:
    """
    Reduce an uploaded filename to a safe, path-free basename.

    Prevents directory traversal (`../../etc/passwd`) and collisions with
    reserved Windows device names.
    """

    name = unicodedata.normalize("NFKD", raw or "").encode("ascii", "ignore").decode("ascii")
    name = os.path.basename(name.replace("\\", "/"))
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._-")
    name = re.sub(r"_{2,}", "_", name)

    if not name:
        name = "upload"

    stem, dot, extension = name.rpartition(".")
    if not dot:
        stem, extension = name, ""

    stem = (stem or "upload")[:150]
    extension = extension[:16]

    reserved = {
        "con", "prn", "aux", "nul",
        *(f"com{i}" for i in range(1, 10)),
        *(f"lpt{i}" for i in range(1, 10)),
    }
    if stem.lower() in reserved:
        stem = f"_{stem}"

    return f"{stem}.{extension}" if extension else stem


def validate_upload(filename: str) -> None:
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension in BLOCKED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Files of type '{extension}' cannot be uploaded",
        )

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type '{extension or 'unknown'}'. "
                "Allowed: " + ", ".join(sorted(ALLOWED_EXTENSIONS))
            ),
        )


def resolve_document_path(stored_path: str) -> str:
    """Resolve a stored document path against the upload root."""

    candidate = os.path.abspath(stored_path)

    if os.path.isfile(candidate):
        return candidate

    # New records store a path relative to the upload root.
    relative = os.path.abspath(os.path.join(UPLOAD_DIR, stored_path))
    if os.path.isfile(relative):
        return relative

    # Legacy rows stored "uploads/<decision>/<name>" relative to the CWD.
    legacy = os.path.abspath(
        os.path.join(
            UPLOAD_DIR, os.path.basename(os.path.dirname(stored_path)), os.path.basename(stored_path)
        )
    )
    if os.path.isfile(legacy):
        return legacy

    raise FileNotFoundError(stored_path)


def delete_document_file(stored_path: str) -> None:
    try:
        path = resolve_document_path(stored_path)
    except FileNotFoundError:
        return

    try:
        os.remove(path)
    except OSError as exc:
        print(f"[uploads] could not delete {stored_path}: {exc}", flush=True)


# ============================================================
# ERROR HANDLING
# ============================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


# ============================================================
# BASIC
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Expert Decision Replay Platform Backend",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    database_ok = True
    detail = "connected"

    try:
        connection = engine.connect()
        connection.close()
    except Exception as exc:  # noqa: BLE001
        database_ok = False
        detail = str(exc)

    payload = {
        "status": "healthy" if database_ok else "degraded",
        "database": "connected" if database_ok else "unavailable",
        "database_detail": detail,
    }

    if not database_ok:
        return JSONResponse(status_code=503, content=payload)

    return payload


# ============================================================
# USERS
# ============================================================

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = DbSession):
    """
    Create a self-service account.

    Self-service registration is always scoped to a non-manager role. Privileged
    accounts are created by an operator (see `seed.py`) or promoted by an
    existing manager, so nobody can grant themselves organization-wide access by
    picking an option in a signup form.
    """

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    requested_role = normalise_role_for_storage(payload.role)
    allow_escalation = env_flag("ALLOW_ROLE_ESCALATION_ON_REGISTER", False)

    if requested_role in MANAGER_ROLES and not allow_escalation:
        requested_role = "employee"

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=requested_role,
    )

    db.add(user)
    db.commit()

    log_audit(
        db,
        action="User registered",
        description=f"New {user.role} account created for {user.name} ({user.email})",
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
    )
    db.commit()

    return {
        "message": "Registration successful",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@app.post("/login")
def login_user(payload: UserLogin, db: Session = DbSession):
    user = db.query(User).filter(User.email == payload.email).first()

    # Same response for unknown user and wrong password.
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Transparently upgrade accounts created before hashing was introduced.
    if not is_hashed(user.password):
        user.password = hash_password(payload.password)
        db.add(user)

    log_audit(
        db,
        action="User login",
        description=f"User {user.name} ({user.email}) logged in",
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
    )
    db.commit()

    access_token, expires_in = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@app.get("/users", response_model=list[UserOut])
def get_users(principal: Principal = CurrentUser, db: Session = DbSession):
    """Manager-only directory. Password hashes are never returned."""

    require_manager(principal)

    return (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )


@app.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    """
    Manager-only role management.

    Self-service signup cannot grant privileged roles, so promoting or demoting
    an account is an explicit, audited manager action.
    """

    require_manager(principal)

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target.id == principal.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role",
        )

    previous = target.role
    target.role = normalise_role_for_storage(payload.role)
    db.add(target)

    log_audit(
        db,
        action="User role changed",
        description=(
            f"{target.name} ({target.email}) role changed from {previous} "
            f"to {target.role} by {principal.name}"
        ),
        user_id=target.id,
        user_name=target.name,
        user_role=target.role,
    )

    db.commit()

    return {
        "message": "Role updated",
        "user_id": target.id,
        "email": target.email,
        "previous_role": previous,
        "role": target.role,
    }


@app.get("/users/me", response_model=UserOut)
def get_me(principal: Principal = CurrentUser, db: Session = DbSession):
    user = db.query(User).filter(User.id == principal.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============================================================
# DECISIONS
# ============================================================

@app.get("/decisions")
def get_decisions(principal: Principal = CurrentUser, db: Session = DbSession):
    """Managers see the whole organization, employees only their own records."""

    query = db.query(Decision)

    if not principal.is_manager:
        query = query.filter(Decision.user_id == principal.id)

    return query.order_by(Decision.id.desc()).all()


@app.get("/decisions/{decision_id}")
def get_decision(decision_id: int, principal: Principal = CurrentUser, db: Session = DbSession):
    return load_decision_for(principal, db, decision_id)


@app.post("/decisions", status_code=status.HTTP_201_CREATED)
def create_decision(
    payload: DecisionCreate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    # Decisions are authored by employees; managers review and complete them.
    if principal.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Managers cannot create decisions",
        )

    if not payload.title:
        raise HTTPException(status_code=400, detail="Decision title is required")

    decision = Decision(
        title=payload.title,
        problem=payload.problem,
        reasoning=payload.reasoning,
        category=payload.category,
        user_id=principal.id,
        status="Draft",
    )

    db.add(decision)
    db.commit()

    db.add(
        DecisionHistory(
            action="Decision created",
            description=f"Decision created by {principal.name}",
            decision_id=decision.id,
        )
    )

    log_audit(db, **audit_for(
        principal,
        action="Decision created",
        description=f"Decision '{decision.title}' created",
        decision_id=decision.id,
    ))

    db.commit()

    return decision


@app.put("/decisions/{decision_id}")
def update_decision(
    decision_id: int,
    final_decision: str,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    """Manager only: record the final decision and close the record."""

    require_manager(principal)

    if not final_decision or not final_decision.strip():
        raise HTTPException(
            status_code=400,
            detail="A final decision is required",
        )

    decision = load_decision(db, decision_id)
    old_status = decision.status

    decision.final_decision = final_decision.strip()
    decision.status = "Completed"
    decision.updated_at = datetime.now(timezone.utc)

    db.add(
        DecisionHistory(
            action="Updated",
            description=(
                f"Status changed from {old_status} to Completed. "
                f"Updated by manager {principal.name}"
            ),
            decision_id=decision.id,
        )
    )

    log_audit(db, **audit_for(
        principal,
        action="Decision completed",
        description=(
            f"Status changed from {old_status} to Completed by {principal.name}"
        ),
        decision_id=decision.id,
    ))

    if decision.user_id:
        create_notification(
            db,
            user_id=decision.user_id,
            title="Decision Completed",
            message=(
                f"Your decision '{decision.title}' was completed by "
                f"{principal.name}."
            ),
            notification_type="success",
            decision_id=decision.id,
        )

    db.commit()

    return decision


@app.put("/decisions/{decision_id}/edit")
def edit_decision(
    decision_id: int,
    payload: DecisionEditUpdate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    require_manager(principal)

    decision = load_decision(db, decision_id)

    changes: list[str] = []

    if payload.title is not None and payload.title.strip() != decision.title:
        decision.title = payload.title.strip()
        changes.append("title changed")

    if payload.problem is not None and payload.problem != decision.problem:
        decision.problem = payload.problem
        changes.append("problem statement updated")

    if payload.reasoning is not None and payload.reasoning != decision.reasoning:
        decision.reasoning = payload.reasoning
        changes.append("reasoning updated")

    if payload.category is not None and payload.category != decision.category:
        decision.category = payload.category or None
        changes.append("category changed")

    if changes:
        decision.updated_at = datetime.now(timezone.utc)

        db.add(
            DecisionHistory(
                action="Edited",
                description=f"{'; '.join(changes)} by manager {principal.name}",
                decision_id=decision.id,
            )
        )

        log_audit(db, **audit_for(
            principal,
            action="Decision edited",
            description=f"{'; '.join(changes)} by manager {principal.name}",
            decision_id=decision.id,
        ))

    db.commit()

    return decision


@app.delete("/decisions/{decision_id}")
def delete_decision(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    require_manager(principal)

    decision = load_decision(db, decision_id)

    title = decision.title

    document_paths = [
        row.filepath
        for row in db.query(Document).filter(Document.decision_id == decision_id).all()
    ]

    # Detach the audit trail instead of deleting it, so the organisation keeps
    # a record that the decision existed.
    db.query(AuditLog).filter(AuditLog.decision_id == decision_id).update(
        {AuditLog.decision_id: None},
        synchronize_session=False,
    )

    db.query(Notification).filter(Notification.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(Alternative).filter(Alternative.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(Review).filter(Review.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(DecisionHistory).filter(DecisionHistory.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(Outcome).filter(Outcome.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(Document).filter(Document.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(Comment).filter(Comment.decision_id == decision_id).delete(
        synchronize_session=False
    )
    db.query(Approval).filter(Approval.decision_id == decision_id).delete(
        synchronize_session=False
    )

    db.delete(decision)

    log_audit(db, **audit_for(
        principal,
        action="Decision deleted",
        description=f"Decision '{title}' (ID #{decision_id}) deleted",
        decision_id=None,
    ))

    db.commit()

    for path in document_paths:
        delete_document_file(path)

    shutil.rmtree(os.path.join(UPLOAD_DIR, str(decision_id)), ignore_errors=True)

    return {"message": "Decision deleted"}


# ============================================================
# DECISION HISTORY / REPLAY
# ============================================================

@app.post("/decisions/{decision_id}/history")
def add_history(
    decision_id: int,
    action: str,
    description: str,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    decision = load_decision_for(principal, db, decision_id)

    if not action or not action.strip():
        raise HTTPException(status_code=400, detail="An action is required")

    history = DecisionHistory(
        action=action.strip(),
        description=description,
        decision_id=decision.id,
    )

    db.add(history)
    db.commit()

    return history


@app.get("/decisions/{decision_id}/history")
def get_history(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    return (
        db.query(DecisionHistory)
        .filter(DecisionHistory.decision_id == decision_id)
        .order_by(DecisionHistory.id.desc())
        .all()
    )


@app.get("/decisions/{decision_id}/replay")
def replay_decision(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    decision = load_decision_for(principal, db, decision_id)

    history = (
        db.query(DecisionHistory)
        .filter(DecisionHistory.decision_id == decision_id)
        .order_by(DecisionHistory.id.asc())
        .all()
    )

    return {
        "decision": decision,
        "history": history,
    }


# ============================================================
# ALTERNATIVES
# ============================================================

@app.post(
    "/decisions/{decision_id}/alternatives",
    response_model=AlternativeOut,
    status_code=status.HTTP_201_CREATED,
)
def create_alternative(
    decision_id: int,
    payload: AlternativeCreate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    decision = load_decision_for(principal, db, decision_id)

    alt = Alternative(
        name=payload.name,
        description=payload.description,
        decision_id=decision.id,
    )

    db.add(alt)
    db.commit()

    db.add(
        DecisionHistory(
            action="Alternative added",
            description=alt.name,
            decision_id=decision.id,
        )
    )

    log_audit(db, **audit_for(
        principal,
        action="Alternative added",
        description=f"Alternative '{alt.name}' added to decision #{decision.id}",
        decision_id=decision.id,
    ))

    db.commit()

    return alt


@app.get(
    "/decisions/{decision_id}/alternatives",
    response_model=list[AlternativeOut],
)
def get_alternatives(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    return (
        db.query(Alternative)
        .filter(Alternative.decision_id == decision_id)
        .order_by(Alternative.id.asc())
        .all()
    )


@app.delete("/alternatives/{alternative_id}")
def delete_alternative(
    alternative_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    alt = db.query(Alternative).filter(Alternative.id == alternative_id).first()

    if not alt:
        raise HTTPException(status_code=404, detail="Alternative not found")

    load_decision_for(principal, db, alt.decision_id)

    alt_name = alt.name
    decision_id = alt.decision_id

    db.delete(alt)

    log_audit(db, **audit_for(
        principal,
        action="Alternative deleted",
        description=(
            f"Alternative '{alt_name}' deleted from decision #{decision_id}"
        ),
        decision_id=decision_id,
    ))

    db.commit()

    return {"message": "Alternative deleted"}


# ============================================================
# REVIEWS
# ============================================================

@app.post(
    "/decisions/{decision_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    decision_id: int,
    payload: ReviewCreate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    decision = load_decision_for(principal, db, decision_id)

    review = Review(
        comment=payload.comment,
        status=payload.status or "Pending",
        decision_id=decision.id,
    )

    db.add(review)
    db.commit()

    log_audit(db, **audit_for(
        principal,
        action="Review added",
        description=f"Review added to decision #{decision.id}",
        decision_id=decision.id,
    ))
    db.commit()

    return review


@app.get(
    "/decisions/{decision_id}/reviews",
    response_model=list[ReviewOut],
)
def get_reviews(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    return (
        db.query(Review)
        .filter(Review.decision_id == decision_id)
        .order_by(Review.id.asc())
        .all()
    )


# ============================================================
# OUTCOMES
# ============================================================

@app.post(
    "/decisions/{decision_id}/outcome",
    response_model=OutcomeOut,
)
def create_outcome(
    decision_id: int,
    payload: OutcomeCreate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    """Record (or update) the outcome of a decision."""

    decision = load_decision_for(principal, db, decision_id)

    outcome = (
        db.query(Outcome)
        .filter(Outcome.decision_id == decision_id)
        .first()
    )

    created = outcome is None

    if outcome is None:
        outcome = Outcome(decision_id=decision.id)
        db.add(outcome)

    outcome.expected_outcome = payload.expected_outcome
    outcome.actual_outcome = payload.actual_outcome
    outcome.result = payload.result

    db.add(
        DecisionHistory(
            action="Outcome recorded" if created else "Outcome updated",
            description=(
                f"Outcome recorded by {principal.name}"
                + (f": {payload.result}" if payload.result else "")
            ),
            decision_id=decision.id,
        )
    )

    log_audit(db, **audit_for(
        principal,
        action="Outcome recorded" if created else "Outcome updated",
        description=(
            f"Outcome {'recorded' if created else 'updated'} for "
            f"decision #{decision.id}"
        ),
        decision_id=decision.id,
    ))

    db.commit()

    return outcome


@app.get(
    "/decisions/{decision_id}/outcome",
    response_model=OutcomeOut,
)
def get_outcome(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    outcome = (
        db.query(Outcome)
        .filter(Outcome.decision_id == decision_id)
        .first()
    )

    if not outcome:
        raise HTTPException(status_code=404, detail="No outcome recorded yet")

    return outcome


# ============================================================
# COMMENTS
# DISCUSSION MODULE
# ============================================================

@app.post(
    "/decisions/{decision_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    decision_id: int,
    payload: CommentCreate,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    decision = load_decision_for(principal, db, decision_id)

    comment = Comment(
        content=payload.content,
        is_meeting_note=bool(payload.is_meeting_note),
        decision_id=decision.id,
        user_id=principal.id,
    )

    db.add(comment)

    log_audit(db, **audit_for(
        principal,
        action="Comment added",
        description=(
            f"Comment posted on decision #{decision.id}: "
            f"{comment.content[:60]}"
        ),
        decision_id=decision.id,
    ))

    db.commit()

    return comment


@app.get(
    "/decisions/{decision_id}/comments",
    response_model=list[CommentOut],
)
def get_comments(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    return (
        db.query(Comment)
        .filter(Comment.decision_id == decision_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
        .all()
    )


# ============================================================
# GLOBAL DISCUSSIONS
#
# MANAGER:   sees everyone's discussions
# EMPLOYEE:  sees only their own discussions
# ============================================================

@app.get("/discussions")
def get_all_discussions(principal: Principal = CurrentUser, db: Session = DbSession):
    query = (
        db.query(
            Comment,
            Decision.title.label("decision_title"),
            User.name.label("user_name"),
            User.role.label("user_role"),
        )
        .join(Decision, Comment.decision_id == Decision.id)
        .outerjoin(User, Comment.user_id == User.id)
    )

    if not principal.is_manager:
        query = query.filter(Comment.user_id == principal.id)

    results = query.order_by(Comment.created_at.desc(), Comment.id.desc()).all()

    return [
        {
            "id": comment.id,
            "content": comment.content,
            "is_meeting_note": bool(comment.is_meeting_note),
            "created_at": comment.created_at,
            "decision_id": comment.decision_id,
            "decision_title": decision_title,
            "user_id": comment.user_id,
            "user_name": user_name or "Unknown User",
            "user_role": user_role or "Employee",
        }
        for comment, decision_title, user_name, user_role in results
    ]


# ============================================================
# DOCUMENTS
# ============================================================

@app.post(
    "/decisions/{decision_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
    file: UploadFile = File(...),
):
    decision = load_decision_for(principal, db, decision_id)

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    filename = safe_filename(file.filename)
    validate_upload(filename)

    relative_folder = str(decision.id)
    folder = os.path.join(UPLOAD_DIR, relative_folder)
    os.makedirs(folder, exist_ok=True)

    # Prefix with a random token so uploads never overwrite each other.
    stored_name = f"{uuid.uuid4().hex}_{filename}"
    relative_path = os.path.join(relative_folder, stored_name)
    absolute_path = os.path.join(UPLOAD_DIR, relative_path)

    written = 0
    try:
        with open(absolute_path, "wb") as buffer:
            while True:
                chunk = file.file.read(UPLOAD_CHUNK_SIZE)
                if not chunk:
                    break

                written += len(chunk)

                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            "File exceeds the maximum upload size of "
                            f"{MAX_UPLOAD_BYTES // (1024 * 1024)} MB"
                        ),
                    )

                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(absolute_path):
            os.remove(absolute_path)
        raise
    except Exception:
        if os.path.exists(absolute_path):
            os.remove(absolute_path)
        raise
    finally:
        file.file.close()

    doc = Document(
        filename=filename,
        filepath=relative_path,
        file_size=written,
        content_type=file.content_type,
        decision_id=decision.id,
        uploaded_by=principal.id,
    )

    db.add(doc)

    db.add(
        DecisionHistory(
            action="Document uploaded",
            description=filename,
            decision_id=decision.id,
        )
    )

    log_audit(db, **audit_for(
        principal,
        action="Document uploaded",
        description=f"File '{filename}' uploaded to decision #{decision.id}",
        decision_id=decision.id,
    ))

    db.commit()

    return doc


@app.get(
    "/decisions/{decision_id}/documents",
    response_model=list[DocumentOut],
)
def get_documents(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    return (
        db.query(Document)
        .filter(Document.decision_id == decision_id)
        .order_by(Document.id.desc())
        .all()
    )


@app.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    doc = db.query(Document).filter(Document.id == document_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not can_read_document(principal, doc):
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        path = resolve_document_path(doc.filepath)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail="File not found on server"
        )

    log_audit(db, **audit_for(
        principal,
        action="Document downloaded",
        description=f"Document '{doc.filename}' (ID #{doc.id}) downloaded",
        decision_id=doc.decision_id,
    ))
    db.commit()

    return FileResponse(path, filename=doc.filename)


@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    doc = db.query(Document).filter(Document.id == document_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    load_decision_for(principal, db, doc.decision_id)

    stored_path = doc.filepath
    filename = doc.filename
    decision_id = doc.decision_id

    db.delete(doc)

    log_audit(db, **audit_for(
        principal,
        action="Document deleted",
        description=f"File '{filename}' deleted from decision #{decision_id}",
        decision_id=decision_id,
    ))

    db.commit()

    delete_document_file(stored_path)

    return {"message": "Document deleted"}


# ============================================================
# KNOWLEDGE REPOSITORY - ALL ACCESSIBLE DOCUMENTS
# ============================================================

@app.get("/documents")
def get_all_documents(principal: Principal = CurrentUser, db: Session = DbSession):
    query = (
        db.query(
            Document,
            Decision,
            Decision.title.label("decision_title"),
            User.name.label("uploader_name"),
        )
        .join(Decision, Document.decision_id == Decision.id)
        .outerjoin(User, Document.uploaded_by == User.id)
    )

    if not principal.is_manager:
        query = query.filter(
            (Decision.user_id == principal.id)
            | (Document.uploaded_by == principal.id)
        )

    results = query.order_by(
        Document.uploaded_at.desc(), Document.id.desc()
    ).all()

    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "filepath": doc.filepath,
            "decision_id": doc.decision_id,
            "decision_title": decision_title or f"Decision #{doc.decision_id}",
            "uploaded_by": doc.uploaded_by,
            "uploader_name": (
                uploader_name
                or (decision.user.name if decision.user else "System User")
            ),
            "uploaded_at": doc.uploaded_at,
            "file_size": doc.file_size,
            "content_type": doc.content_type,
        }
        for doc, decision, decision_title, uploader_name in results
    ]


# ============================================================
# MILESTONE 3
# APPROVAL WORKFLOW
# ============================================================

# ------------------------------------------------------------
# EMPLOYEE: SUBMIT DECISION FOR APPROVAL
# ------------------------------------------------------------

@app.post("/decisions/{decision_id}/submit-approval")
def submit_for_approval(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    decision = load_decision(db, decision_id)

    if principal.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can submit decisions for approval",
        )

    if decision.user_id != principal.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the decision creator can submit this decision",
        )

    if decision.status not in ["Draft", "Rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Decision cannot be submitted from status '{decision.status}'"
            ),
        )

    existing = (
        db.query(Approval)
        .filter(
            Approval.decision_id == decision_id,
            Approval.status == "Pending",
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This decision is already waiting for approval",
        )

    approval = Approval(
        decision_id=decision_id,
        requested_by=principal.id,
        status="Pending",
        comments=None,
    )

    db.add(approval)

    previous_status = decision.status
    decision.status = "Under Review"

    db.add(
        DecisionHistory(
            action="Submitted for approval",
            description=(
                f"Decision submitted for manager approval by {principal.name}"
                + (f" (previous status: {previous_status})" if previous_status != "Draft" else "")
            ),
            decision_id=decision_id,
        )
    )

    managers = (
        db.query(User)
        .filter(User.role.in_(["manager", "admin", "administrator"]))
        .all()
    )

    for manager in managers:
        create_notification(
            db,
            user_id=manager.id,
            title="New Approval Request",
            message=(
                f"{principal.name} submitted '{decision.title}' for approval."
            ),
            notification_type="approval",
            decision_id=decision.id,
        )

    log_audit(db, **audit_for(
        principal,
        action="Decision submitted for approval",
        description=(
            f"Decision '{decision.title}' submitted for manager approval "
            f"by {principal.name}"
        ),
        decision_id=decision.id,
    ))

    db.commit()

    return {
        "message": "Decision submitted for approval",
        "approval_id": approval.id,
        "decision_id": decision_id,
        "status": approval.status,
        "decision_status": decision.status,
    }


# ------------------------------------------------------------
# GET LATEST APPROVAL FOR ONE DECISION
# ------------------------------------------------------------

@app.get("/decisions/{decision_id}/approval")
def get_decision_approval(
    decision_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    load_decision_for(principal, db, decision_id)

    approval = (
        db.query(Approval)
        .filter(Approval.decision_id == decision_id)
        .order_by(Approval.id.desc())
        .first()
    )

    if not approval:
        return {
            "message": "No approval request found",
            "approval": None,
        }

    return {
        "id": approval.id,
        "decision_id": approval.decision_id,
        "requested_by": approval.requested_by,
        "reviewed_by": approval.reviewed_by,
        "status": approval.status,
        "comments": approval.comments,
        "created_at": approval.created_at,
        "reviewed_at": approval.reviewed_at,
    }


# ------------------------------------------------------------
# MANAGER: VIEW APPROVALS
# ------------------------------------------------------------

@app.get("/approvals")
def get_approvals(
    status_filter: str = Query(default="Pending", alias="status"),
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    """
    List approval requests.

    `status` accepts Pending, Approved, Rejected or All.

    Managers see the whole organization queue. Every other role sees only the
    requests they submitted themselves, so they can track the outcome of their
    own submissions without being able to review anyone else's work.
    """

    requested = (status_filter or "Pending").strip()

    query = (
        db.query(Approval, Decision, User)
        .join(Decision, Approval.decision_id == Decision.id)
        .join(User, Approval.requested_by == User.id)
    )

    if not principal.is_manager:
        query = query.filter(Approval.requested_by == principal.id)

    if requested.lower() != "all":
        query = query.filter(Approval.status == requested)

    results = query.order_by(
        Approval.created_at.desc(), Approval.id.desc()
    ).all()

    return [
        {
            "id": approval.id,
            "decision_id": decision.id,
            "decision_title": decision.title,
            "decision_problem": decision.problem,
            "decision_reasoning": decision.reasoning,
            "decision_category": decision.category or "General",
            "decision_status": decision.status,
            "requested_by": employee.id,
            "employee_name": employee.name,
            "employee_email": employee.email,
            "status": approval.status,
            "comments": approval.comments,
            "created_at": approval.created_at,
            "reviewed_at": approval.reviewed_at,
            "reviewed_by": approval.reviewed_by,
        }
        for approval, decision, employee in results
    ]


# ------------------------------------------------------------
# MANAGER: APPROVE DECISION
# ------------------------------------------------------------

@app.put("/approvals/{approval_id}/approve")
def approve_decision(
    approval_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
    payload: Optional[ApprovalDecision] = None,
):
    require_manager(principal)

    approval = db.query(Approval).filter(Approval.id == approval_id).first()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval is already {approval.status}",
        )

    decision = load_decision(db, approval.decision_id)

    comments = payload.comments if payload else None

    approval.status = "Approved"
    approval.reviewed_by = principal.id
    approval.comments = comments
    approval.reviewed_at = datetime.now(timezone.utc)

    decision.status = "Approved"
    decision.updated_at = datetime.now(timezone.utc)

    db.add(
        DecisionHistory(
            action="Decision approved",
            description=f"Decision approved by manager {principal.name}",
            decision_id=decision.id,
        )
    )

    if decision.user_id:
        create_notification(
            db,
            user_id=decision.user_id,
            title="Decision Approved",
            message=(
                f"Your decision '{decision.title}' has been approved by "
                f"manager {principal.name}."
            ),
            notification_type="success",
            decision_id=decision.id,
        )

    log_audit(db, **audit_for(
        principal,
        action="Decision approved",
        description=f"Decision '{decision.title}' approved by manager {principal.name}",
        decision_id=decision.id,
    ))

    db.commit()

    return {
        "message": "Decision approved successfully",
        "approval_id": approval.id,
        "decision_id": decision.id,
        "approval_status": approval.status,
        "decision_status": decision.status,
        "reviewed_by": principal.name,
    }


# ------------------------------------------------------------
# MANAGER: REJECT DECISION
# ------------------------------------------------------------

@app.put("/approvals/{approval_id}/reject")
def reject_decision(
    approval_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
    payload: Optional[ApprovalDecision] = None,
):
    require_manager(principal)

    approval = db.query(Approval).filter(Approval.id == approval_id).first()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if approval.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval is already {approval.status}",
        )

    rejection_reason = (payload.comments if payload else None)

    if not rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A rejection reason is required",
        )

    decision = load_decision(db, approval.decision_id)

    approval.status = "Rejected"
    approval.reviewed_by = principal.id
    approval.comments = rejection_reason
    approval.reviewed_at = datetime.now(timezone.utc)

    decision.status = "Rejected"
    decision.updated_at = datetime.now(timezone.utc)

    db.add(
        DecisionHistory(
            action="Decision rejected",
            description=(
                f"Decision rejected by manager {principal.name}. "
                f"Reason: {rejection_reason}"
            ),
            decision_id=decision.id,
        )
    )

    if decision.user_id:
        create_notification(
            db,
            user_id=decision.user_id,
            title="Decision Rejected",
            message=(
                f"Your decision '{decision.title}' was rejected by manager "
                f"{principal.name}. Reason: {rejection_reason}"
            ),
            notification_type="error",
            decision_id=decision.id,
        )

    log_audit(db, **audit_for(
        principal,
        action="Decision rejected",
        description=(
            f"Decision '{decision.title}' rejected by manager "
            f"{principal.name}. Reason: {rejection_reason}"
        ),
        decision_id=decision.id,
    ))

    db.commit()

    return {
        "message": "Decision rejected",
        "approval_id": approval.id,
        "decision_id": decision.id,
        "approval_status": approval.status,
        "decision_status": decision.status,
        "reviewed_by": principal.name,
        "comments": approval.comments,
    }


# ============================================================
# MILESTONE 3 - NOTIFICATIONS
# ============================================================

def _notification_payload(notification: Notification) -> dict[str, Any]:
    return {
        "id": notification.id,
        "user_id": notification.user_id,
        "decision_id": notification.decision_id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": 1 if notification.is_read else 0,
        "created_at": notification.created_at,
    }


@app.get("/notifications")
def get_notifications(
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == principal.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(100)
        .all()
    )

    return [_notification_payload(item) for item in notifications]


@app.get("/notifications/unread-count")
def get_unread_notification_count(
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == principal.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    return {"count": count}


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.user_id != principal.id:
        raise HTTPException(status_code=403, detail="Access denied")

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}


@app.put("/notifications/read-all")
def mark_all_notifications_read(
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == principal.id,
            Notification.is_read.is_(False),
        )
        .update({Notification.is_read: True}, synchronize_session=False)
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "count": count,
    }


@app.post("/notifications/test")
def create_test_notification(
    target_user_id: int = Query(alias="target_user_id"),
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    """
    Manager only: send a test notification to a user.

    The recipient is named explicitly as `target_user_id` so it can never be
    confused with the caller's own identity.
    """

    require_manager(principal)

    user = db.query(User).filter(User.id == target_user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    notification = create_notification(
        db,
        user_id=user.id,
        title="Test Notification",
        message=(
            "This is a test notification from the Expert Decision "
            "Replay Platform."
        ),
        notification_type="info",
        decision_id=None,
    )

    db.commit()

    return {
        "message": "Test notification created",
        "notification_id": notification.id,
        "user_id": user.id,
    }


# ============================================================
# MILESTONE 3 - MANAGER TEAMS
# ============================================================

@app.get("/teams")
def get_teams(principal: Principal = CurrentUser, db: Session = DbSession):
    """Manager endpoint: team members, roles and decision activity."""

    require_manager(principal)

    all_users = db.query(User).order_by(User.id.asc()).all()

    decisions_by_user = {}

    for decision in db.query(Decision).order_by(Decision.id.desc()).all():
        decisions_by_user.setdefault(decision.user_id, []).append(decision)

    return [
        {
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "role": member.role,
            "joined_at": member.created_at,
            "decisions_count": len(decisions_by_user.get(member.id, [])),
            "decisions": [
                {
                    "id": decision.id,
                    "title": decision.title,
                    "status": decision.status,
                    "category": decision.category or "General",
                }
                for decision in decisions_by_user.get(member.id, [])[:5]
            ],
        }
        for member in all_users
    ]


# ============================================================
# MILESTONE 3 - ANALYTICS
# ============================================================

@app.get("/analytics")
def get_analytics(principal: Principal = CurrentUser, db: Session = DbSession):
    """
    Manager: organization-wide intelligence.
    Employee: own decision performance.
    """

    if principal.is_manager:
        decisions = db.query(Decision).all()
        total_employees = (
            db.query(User)
            .filter(~User.role.in_(["manager", "admin", "administrator", "superadmin"]))
            .count()
        )
        total_discussions = db.query(Comment).count()
        total_documents = db.query(Document).count()
        approvals = db.query(Approval).all()
        is_manager = True
    else:
        decisions = db.query(Decision).filter(Decision.user_id == principal.id).all()
        total_employees = 1
        total_discussions = (
            db.query(Comment).filter(Comment.user_id == principal.id).count()
        )

        decision_ids = [decision.id for decision in decisions]
        total_documents = (
            db.query(Document)
            .filter(Document.decision_id.in_(decision_ids))
            .count()
            if decision_ids
            else 0
        )
        approvals = (
            db.query(Approval)
            .filter(Approval.requested_by == principal.id)
            .all()
        )
        is_manager = False

    categories: dict[str, int] = {}
    for decision in decisions:
        categories[decision.category or "General"] = (
            categories.get(decision.category or "General", 0) + 1
        )

    def count_status(name: str) -> int:
        return sum(1 for decision in decisions if decision.status == name)

    return {
        "scope": "organization" if is_manager else "personal",
        "is_manager": is_manager,
        "total_decisions": len(decisions),
        "draft_count": count_status("Draft"),
        "under_review_count": count_status("Under Review"),
        "approved_count": count_status("Approved"),
        "rejected_count": count_status("Rejected"),
        "completed_count": count_status("Completed"),
        "total_employees": total_employees,
        "total_discussions": total_discussions,
        "total_documents": total_documents,
        "categories": categories,
        "approval_stats": {
            "pending": sum(1 for a in approvals if a.status == "Pending"),
            "approved": sum(1 for a in approvals if a.status == "Approved"),
            "rejected": sum(1 for a in approvals if a.status == "Rejected"),
            "total": len(approvals),
        },
    }


# ============================================================
# MILESTONE 3 - AUDIT LOGS
# ============================================================

@app.get("/audit-logs")
def get_audit_logs(
    action: Optional[str] = None,
    user_filter: Optional[str] = None,
    search: Optional[str] = None,
    principal: Principal = CurrentUser,
    db: Session = DbSession,
):
    """
    Manager: organization-wide logs.
    Employee: own activity plus logs touching their own decisions.
    """

    query = db.query(AuditLog)

    if not principal.is_manager:
        own_decision_ids = [
            row[0]
            for row in db.query(Decision.id)
            .filter(Decision.user_id == principal.id)
            .all()
        ]

        query = query.filter(
            (AuditLog.user_id == principal.id)
            | (AuditLog.decision_id.in_(own_decision_ids))
            | (
                (AuditLog.decision_id.is_(None))
                & (AuditLog.user_id.is_(None))
            )
        )

    if action and action != "All Actions":
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))

    if user_filter and user_filter != "All Users":
        query = query.filter(AuditLog.user_name.ilike(f"%{user_filter.strip()}%"))

    if search and search.strip():
        term = search.strip()
        pattern = f"%{term}%"

        search_match = (
            AuditLog.description.ilike(pattern)
            | AuditLog.action.ilike(pattern)
            | AuditLog.user_name.ilike(pattern)
        )

        if term.isdigit():
            search_match = search_match | (AuditLog.decision_id == int(term))

        query = query.filter(search_match)

    logs = query.order_by(AuditLog.timestamp.desc(), AuditLog.id.desc()).limit(150).all()

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user_name or "System",
            "user_role": log.user_role or "System",
            "action": log.action,
            "decision_id": log.decision_id,
            "description": log.description,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]