from fastapi import APIRouter
from app.api.routes import auth, decisions, users

api_router = APIRouter()

# Register Authentication endpoints under /auth
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Register User Management endpoints under /users
api_router.include_router(users.router, prefix="/users", tags=["User Management"])

# Register Decision Management endpoints under /decisions
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])


@api_router.get("/info", tags=["General"])
def get_api_info():
    """Returns basic API service information."""
    return {
        "service": "Expert Decision Replay Platform API",
        "version": "0.2.0",
        "milestone": "Milestone 2 - Decision Capture and Decision Management",
        "status": "ready"
    }