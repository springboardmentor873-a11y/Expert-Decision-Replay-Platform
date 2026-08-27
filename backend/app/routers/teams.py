from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Team, User, AuditLog, RoleEnum
from app.schemas import TeamCreate, TeamOut, TeamMemberAdd
from app.utils import get_client_ip

router = APIRouter(prefix="/api/teams", tags=["Team Management"])


@router.post(
    "",
    response_model=TeamOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a team (Manager / Administrator only)",
)
def create_team(
    payload: TeamCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.MANAGER, RoleEnum.ADMINISTRATOR)),
):
    if db.query(Team).filter(Team.name == payload.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A team with this name already exists")

    manager = None
    if payload.manager_id:
        manager = db.query(User).filter(User.id == payload.manager_id).first()
        if not manager:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="manager_id does not reference a valid user")

    team = Team(name=payload.name.strip(), description=payload.description, manager_id=payload.manager_id)
    db.add(team)
    db.commit()
    db.refresh(team)

    db.add(AuditLog(
        actor_id=current_user.id,
        action="team_created",
        details=f"Team '{team.name}' created by {current_user.email}",
        ip_address=get_client_ip(request),
    ))
    db.commit()

    return team


@router.get("", response_model=List[TeamOut], summary="List all teams")
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Team).order_by(Team.created_at.desc()).all()


@router.get("/{team_id}", response_model=TeamOut, summary="Get a single team by id")
def get_team(team_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


@router.post(
    "/{team_id}/members",
    response_model=TeamOut,
    summary="Add a member to a team (Manager / Administrator only)",
)
def add_team_member(
    team_id: str,
    payload: TeamMemberAdd,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.MANAGER, RoleEnum.ADMINISTRATOR)),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add an inactive user to a team")

    if user not in team.members:
        team.members.append(user)
        db.commit()
        db.refresh(team)
        db.add(AuditLog(
            actor_id=current_user.id,
            action="team_member_added",
            details=f"{user.email} added to team '{team.name}' by {current_user.email}",
            ip_address=get_client_ip(request),
        ))
        db.commit()
    return team


@router.delete(
    "/{team_id}/members/{user_id}",
    response_model=TeamOut,
    summary="Remove a member from a team (Manager / Administrator only)",
)
def remove_team_member(
    team_id: str,
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.MANAGER, RoleEnum.ADMINISTRATOR)),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    user = db.query(User).filter(User.id == user_id).first()
    if user and user in team.members:
        team.members.remove(user)
        db.commit()
        db.refresh(team)
        db.add(AuditLog(
            actor_id=current_user.id,
            action="team_member_removed",
            details=f"{user.email} removed from team '{team.name}' by {current_user.email}",
            ip_address=get_client_ip(request),
        ))
        db.commit()
    return team
