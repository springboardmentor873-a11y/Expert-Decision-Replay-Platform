from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User
from app.models import Role
from app.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/")
def get_users(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    users = db.query(User).all()

    return [
        {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role_id": user.role_id,
            "role_name": user.role.role_name if user.role else None,
            "team_id": user.team_id,
            "team_name": user.team.team_name if user.team else None
        }
        for user in users
    ]


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role_id": user.role_id,
        "role_name": user.role.role_name if user.role else None,
        "team_id": user.team_id,
        "team_name": user.team.team_name if user.team else None
    }


@router.put("/{user_id}")
def update_user(
    user_id: int,
    role_id: Optional[int] = None,
    team_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role_id not in (3, 4):
        raise HTTPException(
            status_code=403,
            detail="Only a Manager or an Administrator can update users"
        )

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if role_id is not None:
        if role_id == 4 and current_user.role_id != 4:
            raise HTTPException(
                status_code=403,
                detail="Only an Administrator can assign Administrator role"
            )
        role = db.query(Role).filter(Role.role_id == role_id).first()
        if not role:
            raise HTTPException(
                status_code=422,
                detail="Invalid role"
            )
        user.role_id = role_id

    if team_id is not None:
        user.team_id = team_id

    db.commit()
    db.refresh(user)

    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role_id": user.role_id,
        "role_name": user.role.role_name if user.role else None,
        "team_id": user.team_id,
        "team_name": user.team.team_name if user.team else None
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.user_id == user_id).first()

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