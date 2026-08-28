from datetime import datetime, UTC
from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.identity import Role, User, UserProfile
from app.schemas.auth import (
    ChangePasswordRequest,
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserOut,
    UserProfileOut,
    UserRegister,
)
from app.services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(
    data: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
) -> UserOut:
    """Public registration. Automatically assigns the EMPLOYEE role."""
    # Check if email already exists
    existing = db.scalar(
        select(User).where(func_lower := User.email.ilike(data.email.strip().lower()), User.deleted_at.is_(None))
    )
    if existing:
        raise ConflictError(message="A user with this email address is already registered.")

    # Find the employee system role
    employee_role = db.scalar(select(Role).where(Role.code == "employee"))
    if not employee_role:
        # Create default employee role if missing
        employee_role = Role(
            code="employee",
            name="Employee",
            description="Standard employee with decision authoring access",
            is_system=True,
        )
        db.add(employee_role)
        db.flush()

    new_user = User(
        email=data.email.strip().lower(),
        hashed_password=hash_password(data.password),
        role_id=employee_role.id,
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    profile = UserProfile(
        user_id=new_user.id,
        full_name=data.full_name.strip(),
        job_title=data.job_title.strip() if data.job_title else None,
        department=data.department.strip() if data.department else None,
        phone=data.phone.strip() if data.phone else None,
    )
    db.add(profile)
    db.flush()

    log_audit(
        db=db,
        action="user_register",
        entity_type="user",
        entity_id=new_user.id,
        actor_id=new_user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        extra={"email": new_user.email, "role": "employee"},
    )
    db.commit()
    db.refresh(new_user)

    return UserOut(
        id=new_user.id,
        email=new_user.email,
        role_id=new_user.role_id,
        role=employee_role,
        is_active=new_user.is_active,
        profile=UserProfileOut.model_validate(profile),
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
    )


@router.post("/login", response_model=Token)
def login(
    data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
) -> Token:
    """Authenticate user with email and password, returning JWT access & refresh tokens."""
    user = db.scalar(
        select(User).where(User.email.ilike(data.email.strip().lower()), User.deleted_at.is_(None))
    )

    ip = request.client.host if request.client else None
    agent = request.headers.get("user-agent")

    if not user or not verify_password(data.password, user.hashed_password):
        if user:
            log_audit(
                db=db,
                action="login_failure",
                entity_type="user",
                entity_id=user.id,
                actor_id=user.id,
                ip_address=ip,
                user_agent=agent,
                extra={"reason": "invalid_password"},
            )
            db.commit()
        raise UnauthorizedError(message="Invalid email or password.")

    if not user.is_active:
        raise ForbiddenError(message="User account is inactive. Please contact your system administrator.")

    role = db.scalar(select(Role).where(Role.id == user.role_id))
    role_code = role.code if role else "employee"

    access_token = create_access_token(
        subject=user.id,
        extra={"role": role_code, "email": user.email},
    )
    refresh_token = create_refresh_token(subject=user.id)

    log_audit(
        db=db,
        action="login_success",
        entity_type="user",
        entity_id=user.id,
        actor_id=user.id,
        ip_address=ip,
        user_agent=agent,
        extra={"role": role_code},
    )
    db.commit()

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Exchange a valid refresh token for a new access and refresh token pair."""
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError(message="Invalid token type.")
        user_id = UUID(payload.get("sub"))
    except Exception:
        raise UnauthorizedError(message="Invalid or expired refresh token.")

    user = db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not user or not user.is_active:
        raise UnauthorizedError(message="User account no longer valid or is inactive.")

    role = db.scalar(select(Role).where(Role.id == user.role_id))
    role_code = role.code if role else "employee"

    new_access = create_access_token(subject=user.id, extra={"role": role_code, "email": user.email})
    new_refresh = create_refresh_token(subject=user.id)
    return Token(access_token=new_access, refresh_token=new_refresh, token_type="bearer")


@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Retrieve full profile and role information for currently authenticated user."""
    role = db.scalar(select(Role).where(Role.id == current_user.role_id))
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == current_user.id))

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        role_id=current_user.role_id,
        role=role,
        is_active=current_user.is_active,
        profile=UserProfileOut.model_validate(profile) if profile else None,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Change authenticated user password."""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise UnauthorizedError(message="Current password does not match.")

    current_user.hashed_password = hash_password(data.new_password)
    log_audit(
        db=db,
        action="password_change",
        entity_type="user",
        entity_id=current_user.id,
        actor_id=current_user.id,
    )
    db.commit()
    return {"status": "ok", "message": "Password changed successfully."}
