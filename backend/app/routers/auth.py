from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, AuditLog, RoleEnum
from app.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    UserOut, MessageResponse,
)
from app.utils import get_client_ip

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account (defaults to the Employee role)",
)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()

    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        job_title=payload.job_title,
        department=payload.department,
        role=RoleEnum.EMPLOYEE,  # new registrations default to Employee; admins promote later
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    db.add(AuditLog(
        actor_id=user.id,
        action="user_registered",
        details=f"{user.email} registered",
        ip_address=get_client_ip(request),
    ))
    db.commit()

    return user


@router.post("/login", response_model=TokenResponse, summary="Exchange credentials for an access/refresh token pair")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id, user.role.value)

    db.add(AuditLog(
        actor_id=user.id,
        action="login",
        details=f"{user.email} logged in",
        ip_address=get_client_ip(request),
    ))
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse, summary="Exchange a valid refresh token for a new token pair")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    # Always reload the user from the database — never trust the role embedded
    # in an old token, since it may have changed since the token was issued.
    user = db.query(User).filter(User.id == data["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    access_token = create_access_token(user.id, user.role.value)
    new_refresh_token = create_refresh_token(user.id, user.role.value)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", response_model=MessageResponse, summary="Record logout; client must discard both tokens")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    JWTs issued by this API are stateless, so there is no server-side session to
    invalidate. The client is responsible for discarding both tokens on logout.
    This endpoint exists so that logout is still recorded in the audit trail and
    so that a future milestone can add a token-blocklist without changing the
    frontend contract.
    """
    db.add(AuditLog(
        actor_id=current_user.id,
        action="logout",
        details=f"{current_user.email} logged out",
        ip_address=get_client_ip(request),
    ))
    db.commit()
    return MessageResponse(message="Logged out. Discard stored tokens on the client.")
