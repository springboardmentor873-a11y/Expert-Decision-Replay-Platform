from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.database import get_db
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.schemas.team import AddTeamMember, TeamCreate, TeamDetailResponse, TeamResponse
from app.services.audit_service import log_audit


router = APIRouter(prefix="/teams", tags=["Teams"])


def _with_member_count(team: Team) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "department": team.department,
        "created_at": team.created_at,
        "member_count": len(team.members),
    }


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Manager", "Administrator")),
):
    if db.query(Team).filter(Team.name == team_data.name).first():
        raise HTTPException(status_code=409, detail="A team with this name already exists")

    team = Team(name=team_data.name, department=team_data.department)
    db.add(team)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.TEAM,
        entity_id=team.id,
        description=f"User {current_user.id} created team '{team.name}'",
        request_method="POST",
        endpoint="/teams",
    )

    db.commit()
    db.refresh(team)
    return _with_member_count(team)


@router.get("", response_model=List[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Team)

    # Employees and Reviewers see teams in their own department only;
    # Managers and Administrators see everything.
    if current_user.role not in ("Manager", "Administrator"):
        query = query.filter(Team.department == current_user.department)

    teams = query.order_by(Team.name.asc()).all()
    return [_with_member_count(t) for t in teams]


def _get_team_or_404(db: Session, team_id: int) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/{team_id}", response_model=TeamDetailResponse)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = _get_team_or_404(db, team_id)

    if current_user.role not in ("Manager", "Administrator") and team.department != current_user.department:
        raise HTTPException(status_code=403, detail="You are not authorized to view this team")

    members = [m.user for m in team.members]

    return {
        "id": team.id,
        "name": team.name,
        "department": team.department,
        "created_at": team.created_at,
        "member_count": len(members),
        "members": members,
    }


@router.post("/{team_id}/members", response_model=TeamDetailResponse)
def add_team_member(
    team_id: int,
    payload: AddTeamMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Manager", "Administrator")),
):
    team = _get_team_or_404(db, team_id)

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="User is already a member of this team")

    membership = TeamMember(team_id=team_id, user_id=user.id)
    db.add(membership)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.TEAM,
        entity_id=team.id,
        description=f"User {current_user.id} added {user.email} to team '{team.name}'",
        request_method="POST",
        endpoint=f"/teams/{team_id}/members",
    )

    db.commit()
    db.refresh(team)

    members = [m.user for m in team.members]
    return {
        "id": team.id,
        "name": team.name,
        "department": team.department,
        "created_at": team.created_at,
        "member_count": len(members),
        "members": members,
    }


@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Manager", "Administrator")),
):
    team = _get_team_or_404(db, team_id)

    membership = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="This user is not a member of this team")

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.TEAM,
        entity_id=team.id,
        description=f"User {current_user.id} removed user {user_id} from team '{team.name}'",
        request_method="DELETE",
        endpoint=f"/teams/{team_id}/members/{user_id}",
    )

    db.delete(membership)
    db.commit()

    return {"message": "Member removed from team"}
