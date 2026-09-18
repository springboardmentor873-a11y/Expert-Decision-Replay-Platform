from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import users, decisions, alternatives, discussions, documents, teams, audit_logs, notifications, approvals, reports

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(discussions.router)
app.include_router(documents.router)
app.include_router(teams.router)
app.include_router(audit_logs.router)
app.include_router(notifications.router)
app.include_router(approvals.router)
app.include_router(reports.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Expert Decision Replay Platform API"}
