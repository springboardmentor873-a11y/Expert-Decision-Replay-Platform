from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token
from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserRegisterRequest, UserResponse
from app.services.user_service import authenticate_user, create_user

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user with full_name, email, password, and assigned role.",
)
def register_user(
    user_in: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """Handles user registration and returns sanitized user payload without hashed_password."""
    user = create_user(db=db, user_in=user_in)
    return user


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user credentials and returns a signed JWT access token.",
)
def login(
    login_in: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticates user and returns JWT bearer access token with user details in payload."""
    user = authenticate_user(db=db, login_in=login_in)

    # Construct JWT token payload
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name if user.role else "Employee",
        "full_name": user.full_name,
    }

    access_token = create_access_token(data=token_payload)
    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user",
    description="Returns the currently authenticated user's profile information.",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """Returns safe user information for the authenticated token holder."""
    return current_user