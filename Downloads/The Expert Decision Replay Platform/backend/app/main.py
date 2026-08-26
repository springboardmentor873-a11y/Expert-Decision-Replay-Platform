from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal, init_db
from app.models.user import Role, Team, User
from app.routes import auth_router, users_router

app = FastAPI(title="Expert Decision Replay Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)


@app.on_event("startup")
def startup() -> None:
    init_db()
    seed_standard_accounts()


def seed_standard_accounts() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User).limit(1)):
            return
        team = Team(name="Replay Operations")
        db.add(team)
        db.flush()
        accounts = [
            ("Administrator", "admin@replay.local", Role.ADMINISTRATOR),
            ("Manager", "manager@replay.local", Role.MANAGER),
            ("Reviewer", "reviewer@replay.local", Role.REVIEWER),
            ("Employee", "employee@replay.local", Role.EMPLOYEE),
        ]
        db.add_all([
            User(full_name=name, email=email, password_hash=hash_password("Pass@1234"), role=role, team_id=team.id)
            for name, email, role in accounts
        ])
        db.commit()


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
