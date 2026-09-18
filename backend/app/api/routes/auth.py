from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token
from app.database.database import get_db
from app.models.audit_log import AuditActionEnum
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserRegisterRequest, UserResponse
from app.services.audit_service import create_audit_log
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
    request: Request = None,
    db: Session = Depends(get_db),
):
    """Authenticates user and returns JWT bearer access token with user details in payload."""
    user = authenticate_user(db=db, login_in=login_in)

    # Audit logging for successful login
    create_audit_log(
        db=db,
        action=AuditActionEnum.USER_LOGIN,
        entity_type="User",
        entity_id=user.id,
        user_id=user.id,
        description=f"User {user.email} logged in successfully",
        details={
            "user_id": user.id,
            "email": user.email,
            "role": user.role.name if user.role else "Employee",
        },
        request=request,
    )

    # Construct JWT token payload
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.name if user.role else "Employee",
        "full_name": user.full_name,
    }

    access_token = create_access_token(data=token_payload)
    return Token(access_token=access_token, token_type="bearer")


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Logs out the current authenticated user and records an audit log.",
)
def logout(
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Audits user logout action."""
    create_audit_log(
        db=db,
        action=AuditActionEnum.USER_LOGOUT,
        entity_type="User",
        entity_id=current_user.id,
        user_id=current_user.id,
        description=f"User {current_user.email} logged out",
        details={
            "user_id": current_user.id,
            "email": current_user.email,
        },
        request=request,
    )
    return {"message": "Logged out successfully"}


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