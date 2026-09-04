"""
Expert Decision Replay Platform - Milestone 1 Backend
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import check_database_connection
from app.routers import auth, users, teams

app = FastAPI(
    title="Expert Decision Replay Platform API",
    description=(
        "Milestone 1 backend: authentication, user management, and the "
        "foundational database schema for the Expert Decision Replay "
        "Platform."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------
# CORS - allows the plain HTML/CSS/JS frontend (served from a different
# origin/port) to call this API from the browser.
# ---------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(teams.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Expert Decision Replay Platform API is running.",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Simple health endpoint. Confirms the API process is up AND that it
    can currently reach the MySQL database.
    """
    db_ok = check_database_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "api": "running",
        "database_connected": db_ok,
    }
