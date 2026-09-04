from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

import schemas
import models
import auth
import database


router = APIRouter(tags=["users"])


# -------------------------
# Register User
# -------------------------
@router.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db)
):
    # Check whether email already exists
    db_user = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password before storing it
    hashed_password = auth.get_password_hash(user.password)

    # Create new user
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# -------------------------
# Login User
# -------------------------
@router.post(
    "/login",
    response_model=schemas.Token
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    # OAuth2 uses "username" field.
    # We are using the email as the username.
    user = (
        db.query(models.User)
        .filter(models.User.email == form_data.username)
        .first()
    )

    # Check user and password
    if not user or not auth.verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Token expiration
    access_token_expires = timedelta(
        minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Create JWT token
    access_token = auth.create_access_token(
        data={
            "sub": user.email,
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# -------------------------
# Get Current User
# -------------------------
@router.get(
    "/users/me",
    response_model=schemas.UserResponse
)
def read_users_me(
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user
