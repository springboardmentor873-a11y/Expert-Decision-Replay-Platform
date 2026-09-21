from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth
from app.routes import roles
from app.routes import teams
from app.routes import decisions
from app.routes import alternatives
from app.routes import documents
from app.routes import discussion
from app.routes import users
from app.routes import dashboard
from app.routes import notifications
from app.routes import audit_logs
from app.routes import discussions
from app.routes import insights
from app.routes import search
from app.routes import knowledge
from app.routes import reports
from app.routes import meetings


# ==========================================
# APP
# ==========================================

app = FastAPI(
    title="Expert Decision Replay Platform",
    description="Decision Intelligence Platform",
    version="1.0.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ==========================================
# ROUTERS
# ==========================================

app.include_router(auth.router)

app.include_router(roles.router)

app.include_router(teams.router)

app.include_router(decisions.router)

app.include_router(alternatives.router)

app.include_router(documents.router)

app.include_router(discussion.router)

app.include_router(users.router)

app.include_router(dashboard.router)

app.include_router(notifications.router)

app.include_router(audit_logs.router)

app.include_router(discussions.router)

app.include_router(insights.router)

app.include_router(search.router)

app.include_router(knowledge.router)

app.include_router(reports.router)

app.include_router(meetings.router)


# ==========================================
# CREATE TABLES
# ==========================================

from app.database import engine
from app.database import Base
from app.database import SessionLocal


Base.metadata.create_all(bind=engine)


# ==========================================
# LEGACY STATUS MIGRATION (idempotent)
# ==========================================
# Older versions used "Active" as the default status. With the
# approval workflow, every decision now starts as "Draft".
# Existing "Active" decisions are converted to "Draft" safely
# (no tables are dropped or recreated; no data is deleted).

def _migrate_legacy_active_statuses():

    db = SessionLocal()

    try:

        from sqlalchemy import update
        from app.models import Decision

        result = (
            db.execute(
                update(Decision)
                .where(Decision.status == "Active")
                .values(status="Draft")
            )
        )

        if result.rowcount:
            db.commit()

    finally:

        db.close()


_migrate_legacy_active_statuses()


# ==========================================
# KNOWLEDGE ARTICLE SEED (idempotent)
# ==========================================
# Creates starter knowledge articles only when the table is empty,
# derived from real past decisions. No existing data is touched.

def _seed_knowledge_articles():

    db = SessionLocal()

    try:

        from app.routes.knowledge import seed_knowledge_articles

        seed_knowledge_articles(db)

    finally:

        db.close()


_seed_knowledge_articles()


# ==========================================
# TEAM MEETING SEED (idempotent)
# ==========================================
# Creates a few starter meetings only when the meetings table is
# empty. Every meeting references real teams, users and decisions
# already present in the database. No existing data is touched.

def _seed_meetings():

    db = SessionLocal()

    try:

        from datetime import datetime
        from datetime import timedelta

        from app.models import Meeting
        from app.models import Team
        from app.models import User
        from app.models import Decision

        if db.query(Meeting).count() > 0:
            return

        base = datetime.utcnow()

        def pick_organizer(team):

            if team is None:
                return None

            if team.manager_user_id:
                manager = (
                    db.query(User)
                    .filter(User.user_id == team.manager_user_id)
                    .first()
                )
                if manager:
                    return manager

            return (
                db.query(User)
                .filter(User.team_id == team.team_id)
                .order_by(User.user_id.asc())
                .first()
            )

        def find_team(name):

            return (
                db.query(Team)
                .filter(Team.team_name == name)
                .first()
            )

        def find_decision(title):

            return (
                db.query(Decision)
                .filter(Decision.title == title)
                .first()
            )

        def schedule(days, hour):

            return (base + timedelta(days=days)).replace(
                hour=hour,
                minute=0,
                second=0,
                microsecond=0
            )

        seed_rows = [
            (
                "Data Storage Decision Review",
                "Data Science",
                "Implement Cloud-Based Data Storage",
                schedule(2, 10),
                45,
                "Online - Zoom",
                "Review storage options and confirm the cloud vendor."
            ),
            (
                "Centralized Platform Walkthrough",
                "Software Development",
                "Implement a Centralized Decision Management Platform",
                schedule(3, 14),
                60,
                "Meeting Room A",
                "Walk through the centralized platform rollout plan."
            ),
            (
                "ML Model Governance Sync",
                "AI and Machine Learning",
                None,
                schedule(4, 11),
                30,
                "Online - Teams",
                "Align on model governance and evaluation cadence."
            ),
            (
                "Hybrid Work Policy Alignment",
                "Management",
                "Adopt a Hybrid Work Model",
                schedule(5, 15),
                45,
                "Board Room",
                "Finalize hybrid work policy details with team leads."
            ),
            (
                "Data Science Retrospective",
                "Data Science",
                None,
                schedule(-3, 16),
                30,
                "Online - Zoom",
                "Retrospective on the previous sprint."
            )
        ]

        for (
            title,
            team_name,
            decision_title,
            scheduled_at,
            duration,
            location,
            agenda
        ) in seed_rows:

            team = find_team(team_name)

            decision = (
                find_decision(decision_title)
                if decision_title
                else None
            )

            organizer = pick_organizer(team)

            meeting = Meeting(
                title=title,
                team_id=team.team_id if team else None,
                organizer_id=(
                    organizer.user_id
                    if organizer
                    else None
                ),
                decision_id=(
                    decision.decision_id
                    if decision
                    else None
                ),
                scheduled_at=scheduled_at,
                duration_minutes=duration,
                location=location,
                agenda=agenda,
                status="Scheduled"
            )

            db.add(meeting)

        db.commit()

    finally:

        db.close()


_seed_meetings()


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "message":
        "Expert Decision Replay Platform API is running"
    }