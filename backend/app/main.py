from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers import auth, users, teams, audit
from app.schemas import HealthResponse

# Milestone 1: schema is managed by Alembic migrations (see alembic/ and
# scripts/docker-entrypoint.sh, which runs `alembic upgrade head` on container
# start). Base.metadata.create_all() is intentionally NOT used here — the
# migration history is the single source of truth for the database schema.

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Decision Replay Platform API. Milestone 1 scope: Authentication, "
        "User Management, Role-Based Access Control, Team Management and an "
        "Audit Log foundation that later milestones extend to cover "
        "Decisions, Evidence, Reviews, Approvals and Replay."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Authentication", "description": "Register, login, refresh, logout."},
        {"name": "User Management", "description": "Profiles, role changes, activation/deactivation."},
        {"name": "Team Management", "description": "Teams and team membership."},
        {"name": "Audit", "description": "Security-sensitive event history (Administrator only)."},
        {"name": "Health", "description": "Liveness and database connectivity checks."},
        {"name": "Future: Decisions", "description": "Reserved for the Decision/Evidence/Review/Approval/Replay modules."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(audit.router)


def _check_database() -> str:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return "connected"
    except Exception:
        return "unavailable"


@app.get("/health", response_model=HealthResponse, tags=["Health"], summary="Liveness + database connectivity")
def health_check():
    return HealthResponse(status="ok", project=settings.PROJECT_NAME, database=_check_database())


@app.get("/api/health", response_model=HealthResponse, tags=["Health"], summary="Alias of /health under the API prefix")
def health_check_api():
    return health_check()
