from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import alternatives, auth, decisions, files, users

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Backend API for the Expert Decision Replay Platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(decisions.router)
app.include_router(alternatives.router)
app.include_router(files.router)


@app.get("/")
def root():
    return {"message": "Decision Platform API", "status": "running"}


@app.get("/health")
def health_check():
    """Used by Docker / uptime checks to confirm the app is alive."""
    return {"status": "ok"}
