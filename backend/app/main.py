from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Team, RoleEnum
from app.auth import get_password_hash
from app.routers import auth, users, teams, decisions, discussions, alternatives, attachments


def seed_initial_data(db: Session):
    """Seed initial sample teams and role-based test users if database is empty."""
    # Seed Teams
    if db.query(Team).count() == 0:
        engineering_team = Team(
            name="Platform Architecture & Engineering",
            description="Core infrastructure and platform architecture decision unit"
        )
        product_team = Team(
            name="Product Strategy & UX",
            description="Product roadmap, specifications, and design choices"
        )
        governance_team = Team(
            name="Executive Governance & Risk",
            description="Strategic decisions, compliance, and enterprise oversight"
        )
        db.add_all([engineering_team, product_team, governance_team])
        db.commit()
        db.refresh(engineering_team)
        db.refresh(product_team)
        db.refresh(governance_team)

        # Seed Users for every Role
        default_users = [
            User(
                email="admin@decisionreplay.com",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Sarah Connor (Administrator)",
                role=RoleEnum.ADMINISTRATOR,
                team_id=governance_team.id,
                is_active=True
            ),
            User(
                email="manager@decisionreplay.com",
                hashed_password=get_password_hash("Manager@123"),
                full_name="Alex Mercer (Engineering Manager)",
                role=RoleEnum.MANAGER,
                team_id=engineering_team.id,
                is_active=True
            ),
            User(
                email="reviewer@decisionreplay.com",
                hashed_password=get_password_hash("Reviewer@123"),
                full_name="Elena Vance (Senior Reviewer)",
                role=RoleEnum.REVIEWER,
                team_id=product_team.id,
                is_active=True
            ),
            User(
                email="employee@decisionreplay.com",
                hashed_password=get_password_hash("Employee@123"),
                full_name="Gordon Freeman (Staff Engineer)",
                role=RoleEnum.EMPLOYEE,
                team_id=engineering_team.id,
                is_active=True
            ),
        ]
        db.add_all(default_users)
        db.commit()
        print("Database initialized and seeded with default teams and role accounts.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for the Expert Decision Replay Platform - Milestone 2",
    lifespan=lifespan
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(decisions.router, prefix=settings.API_V1_STR)
app.include_router(discussions.router, prefix=settings.API_V1_STR)
app.include_router(alternatives.router, prefix=settings.API_V1_STR)
app.include_router(attachments.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }


@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
