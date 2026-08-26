from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_user, require_admin
from app.database import get_db
from app.models.user import Role, Team, User
from app.schemas import TeamCreate, TeamResponse, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserResponse])
def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.scalars(select(User).options(joinedload(User.team)).order_by(User.created_at.desc())).all()


@router.get("/teams", response_model=list[TeamResponse])
def list_teams(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.scalars(select(Team).order_by(Team.name)).all()


@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.scalar(select(Team).where(Team.name == payload.name.strip())):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A team with this name already exists")
    team = Team(name=payload.name.strip())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_role(user_id: int, role: Role, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.scalar(select(User).options(joinedload(User.team)).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_status(user_id: int, is_active: bool, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.scalar(select(User).options(joinedload(User.team)).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


