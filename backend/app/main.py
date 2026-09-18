from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.router import api_router
from app.api.routes import auth, decisions, users
from app.database.database import Base, engine, SessionLocal
from app.models import (
    Alternative,
    Approval,
    ApprovalStep,
    ApprovalWorkflow,
    AuditLog,
    Category,
    Decision,
    DecisionTag,
    DecisionVersion,
    Discussion,
    Document,
    MeetingNote,
    Notification,
    Role,
    Tag,
    Team,
    TeamMember,
    User,
)
from app.services.user_service import seed_roles_if_needed
from app.database.schema_sync import sync_database_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    # Ensure tables and columns exist and default roles are seeded safely
    try:
        sync_database_schema(engine)
        db = SessionLocal()
        try:
            seed_roles_if_needed(db)
        finally:
            db.close()
    except Exception as exc:
        print(f"[Warning] Database auto-init skipped or deferred: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API for the Expert Decision Replay Platform - Milestone 2",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

from app.api.routes import (
    approval_workflows,
    approvals,
    audit_logs,
    auth,
    categories,
    dashboard,
    decisions,
    knowledge_repository,
    meeting_notes,
    notifications,
    reports,
    tags,
    teams,
    users,
)

# Also expose direct endpoints for convenience if called at root level
app.include_router(auth.router, prefix="/auth", tags=["Authentication (Direct)"])
app.include_router(users.router, prefix="/users", tags=["User Management (Direct)"])
app.include_router(decisions.router, prefix="/decisions", tags=["Decisions (Direct)"])
app.include_router(approvals.router, prefix="/approvals", tags=["Approval Workflows (Direct)"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications (Direct)"])
app.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs (Direct)"])
app.include_router(reports.router, prefix="/reports", tags=["Reports & Analytics (Direct)"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard (Direct)"])
app.include_router(teams.router, prefix="/teams", tags=["Teams (Direct)"])
app.include_router(categories.router, prefix="/categories", tags=["Categories (Direct)"])
app.include_router(tags.router, prefix="/tags", tags=["Tags (Direct)"])
app.include_router(meeting_notes.router, prefix="", tags=["Meeting Notes (Direct)"])
app.include_router(approval_workflows.router, prefix="", tags=["Approval Workflows (Direct)"])
app.include_router(knowledge_repository.router, prefix="/knowledge-repository", tags=["Knowledge Repository (Direct)"])



@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/", tags=["Root"])
def root():
    """Root landing endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "health": "/health",
        "docs": "/docs"
    }