import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.db.database import get_db, SessionLocal

from app.routers.alternatives import router as alternatives_router
from app.routers.users import router as user_router
from app.routers.auth import router as auth_router
from app.routers.decisions import router as decision_router
from app.routers.discussion_threads import router as discussion_threads_router
from app.routers.thread_replies import router as thread_replies_router
from app.routers.meeting_notes import router as meeting_notes_router
from app.routers.decision_rationale import router as rationale_router
from app.routers.comments import router as comments_router
from app.routers.activities import router as activities_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.dashboard import router as dashboard_router
from app.routers.approvals import router as approvals_router
from app.routers.reports import router as reports_router
from app.routers.documents import router as documents_router
from app.routers.teams import router as teams_router
from app.routers.discussions import router as discussions_router
from app.routers.analytics import router as analytics_router
from app.routers.user_settings import router as user_settings_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("expert_decision_replay")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s v%s starting up", settings.app_name, settings.app_version)
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection verified.")
    except Exception as exc:  # pragma: no cover - startup diagnostics only
        logger.error("Database connection FAILED at startup: %s", exc)
    yield
    logger.info("%s shutting down", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Expert Decision Replay Platform - track decisions, alternatives, "
        "discussions, rationale and approvals, then replay how a decision "
        "evolved over time."
    ),
    lifespan=lifespan,
)


# ----------------------------------------------------------------------
# CORS - restricted to configured local frontend origin(s), never "*".
# ----------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.exception("Unhandled server error on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


# ----------------------------------------------------------------------
# Root & health
# ----------------------------------------------------------------------
@app.get("/", tags=["System"])
def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health", tags=["System"])
def health_check():
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "disconnected"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "database": db_status,
    }


# User Management
app.include_router(user_router)

# Authentication
app.include_router(auth_router)

# Decision Management
app.include_router(decision_router)

# Alternative Analysis
app.include_router(alternatives_router)

# Discussion Module
app.include_router(discussion_threads_router)
app.include_router(thread_replies_router)

# Meeting Notes
app.include_router(meeting_notes_router)

# Decision Rationale
app.include_router(rationale_router)

# Comments
app.include_router(comments_router)

# Dashboard
app.include_router(dashboard_router)

# Activity Logging
app.include_router(activities_router)

# Audit & Compliance
app.include_router(audit_logs_router)

# Approval Workflow
app.include_router(approvals_router)

# Reports and Export Module
app.include_router(reports_router)

# File Documents
app.include_router(documents_router)

# Teams
app.include_router(teams_router)

# Cross-decision discussions
app.include_router(discussions_router)

# Analytics
app.include_router(analytics_router)

# User Settings
app.include_router(user_settings_router)
