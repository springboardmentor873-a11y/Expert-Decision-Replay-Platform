from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from passlib.context import CryptContext

from jose import jwt

from app.database import get_db
from app.models import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================
# PASSWORD HASHING
# ==========================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==========================================
# JWT
# ==========================================

SECRET_KEY = "expert-decision-replay-secret"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ==========================================
# REGISTER REQUEST
# ==========================================

class RegisterRequest(BaseModel):

    name: str
    email: EmailStr
    password: str
    role_id: int
    team_id: int


# ==========================================
# HASH PASSWORD
# ==========================================

def hash_password(password: str):

    return pwd_context.hash(password)


# ==========================================
# VERIFY PASSWORD
# ==========================================

def verify_password(
    plain_password: str,
    hashed_password: str
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ==========================================
# CREATE TOKEN
# ==========================================

def create_access_token(
    user_id: int,
    email: str
):

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ==========================================
# REGISTER
# ==========================================

@router.post("/register")
def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # CHECK IF EMAIL ALREADY EXISTS
    # --------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == user_data.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # --------------------------------------
    # CREATE NEW USER
    # --------------------------------------

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(
            user_data.password
        ),
        role_id=user_data.role_id,
        team_id=user_data.team_id
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "role_id": new_user.role_id,
            "team_id": new_user.team_id
        }
    }


# ==========================================
# LOGIN
# ==========================================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # --------------------------------------
    # FIND USER BY EMAIL
    # --------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == form_data.username
        )
        .first()
    )

    # --------------------------------------
    # EMAIL NOT REGISTERED
    # --------------------------------------

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # --------------------------------------
    # CHECK PASSWORD
    # --------------------------------------

    password_correct = verify_password(
        form_data.password,
        user.password_hash
    )

    if not password_correct:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # --------------------------------------
    # CREATE LOGIN TOKEN
    # --------------------------------------

    access_token = create_access_token(
        user.user_id,
        user.email
    )

    # --------------------------------------
    # SUCCESS
    # --------------------------------------

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role_id": user.role_id,
            "team_id": user.team_id
        }
    }