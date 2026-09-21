from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.routers import users
from app.routers import teams
from app.routers import decisions
from app.routers import alternatives
from app.routers import files
from app.routers import discussion
from app.routers import versions, approvals
from app.security.jwt import get_current_user
from app.security.dependencies import require_roles
from app.routers import notifications
from app.routers import audit_logs
from app.routers import reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expert Decision Replay Platform API",
    version="1.0.0"
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


Base.metadata.create_all(bind=engine)


app.include_router(users.router)
app.include_router(teams.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(files.router)
app.include_router(discussion.router)
app.include_router(versions.router)
app.include_router(approvals.router)
app.include_router(notifications.router)
app.include_router(audit_logs.router)
app.include_router(reports.router)
@app.get("/")
def root():
    return {
        "message": "Expert Decision Replay Platform API is running"
    }


@app.get("/database-test")
def database_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "Connected successfully"
        }

    except Exception as e:
        return {
            "database": "Connection failed",
            "error": str(e)
        }


@app.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "team_id": current_user.team_id
    }


@app.get("/admin-test")
def admin_test(
    current_user=Depends(
        require_roles("Administrator")
    )
):
    return {
        "message": "Administrator access granted",
        "user": current_user.full_name
    }
    