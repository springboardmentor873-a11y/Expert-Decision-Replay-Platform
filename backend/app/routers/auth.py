"""
Authentication routes: registration, login, and the current-user endpoint.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from mysql.connector import Error as MySQLError

from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.models.user_model import get_user_by_email, create_user, get_user_by_id
from app.models.team_model import get_team_by_id

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_row_to_out(user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        full_name=user["full_name"],
        email=user["email"],
        role=user["role"],
        team_id=user.get("team_id"),
        team_name=user.get("team_name"),
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister):
    """Register a new user. Passwords are hashed before storage."""

    existing = get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    if payload.team_id is not None:
        team = get_team_by_id(payload.team_id)
        if team is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified team_id does not exist.",
            )

    try:
        password_hash = hash_password(payload.password)
        new_id = create_user(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=password_hash,
            role=payload.role,
            team_id=payload.team_id,
        )
    except MySQLError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while creating user: {exc}",
        )

    created = get_user_by_id(new_id)
    return _user_row_to_out(created)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint. Accepts standard OAuth2 form fields (username, password)
    so it also works directly from FastAPI's /docs "Authorize" button.
    The "username" field should contain the user's email address.
    """
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": str(user["id"]), "role": user["role"], "email": user["email"]}
    )

    return TokenResponse(access_token=token, user=_user_row_to_out(user))


@router.post("/login-json", response_model=TokenResponse)
def login_json(payload: UserLogin):
    """
    JSON-based login endpoint for the plain HTML/JS frontend, which
    sends application/json rather than an OAuth2 form. Functionally
    identical to /auth/login.
    """
    user = get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(
        data={"sub": str(user["id"]), "role": user["role"], "email": user["email"]}
    )

    return TokenResponse(access_token=token, user=_user_row_to_out(user))


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: dict = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return _user_row_to_out(current_user)
