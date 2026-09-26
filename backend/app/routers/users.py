from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import User, Role, Team
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.security.jwt import create_access_token, get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check whether email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check whether role exists
    role = (
        db.query(Role)
        .filter(Role.id == user.role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    # Hash password
    hashed_password = pwd_context.hash(user.password)

    # Create user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role_id=user.role_id,
        team_id=user.team_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd_context.verify(
        user.password,
        existing_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "email": existing_user.email,
            "role_id": existing_user.role_id
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": existing_user.id,
        "full_name": existing_user.full_name,
        "role_id": existing_user.role_id
    }
    
@router.put("/{user_id}/team/{team_id}", response_model=UserResponse)
def assign_user_to_team(
    user_id: int,
    team_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    team = (
        db.query(Team)
        .filter(Team.id == team_id)
        .first()
    )

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    user.team_id = team_id

    db.commit()
    db.refresh(user)

    return user

@router.delete("/{user_id}/team")
def remove_user_from_team(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.team_id = None

    db.commit()
    db.refresh(user)

    return {
        "message": "User removed from team successfully"
    }

@router.get("/", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db)
):
    users = db.query(User).all()

    return users

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user   

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    } 