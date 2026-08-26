from fastapi import APIRouter
from app.api.routes import auth, users

api_router = APIRouter()

# Register Authentication endpoints under /auth
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Register User Management endpoints under /users
api_router.include_router(users.router, prefix="/users", tags=["User Management"])


@api_router.get("/info", tags=["General"])
def get_api_info():
    """Returns basic API service information."""
    return {
        "service": "Expert Decision Replay Platform API",
        "version": "0.1.0",
        "milestone": "Milestone 1 - RBAC & User Management",
        "status": "ready"
    }