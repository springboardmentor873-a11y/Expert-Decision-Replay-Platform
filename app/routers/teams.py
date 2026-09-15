"""
Teams router — list teams and retrieve detail including members and their decisions.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.decision import Decision
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User

router = APIRouter(prefix="/teams", tags=["Teams"])


# ------------------------------------------------------------------ #
# GET /teams                                                           #
# ------------------------------------------------------------------ #
@router.get("")
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all teams with member count.
    - Administrator: all teams
    - Manager: teams in their department
    - Everyone else: teams they belong to
    """
    query = db.query(Team)

    if current_user.role == "Manager":
        query = query.filter(Team.department == current_user.department)
    elif current_user.role not in ("Administrator",):
        # Employee / Reviewer: only teams they are members of
        my_team_ids = [
            row[0]
            for row in db.query(TeamMember.team_id)
            .filter(TeamMember.user_id == current_user.id)
            .all()
        ]
        query = query.filter(Team.id.in_(my_team_ids))

    teams = query.order_by(Team.name.asc()).all()

    result = []
    for team in teams:
        member_count = (
            db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        )
        result.append(
            {
                "id": team.id,
                "name": team.name,
                "department": team.department,
                "member_count": member_count,
                "created_at": team.created_at,
            }
        )
    return result


# ------------------------------------------------------------------ #
# GET /teams/{id}                                                      #
# ------------------------------------------------------------------ #
@router.get("/{team_id}")
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns team detail with members and each member's active decisions.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Team not found"
        )

    # Authorization: Administrator sees all; Manager sees own dept; others see only their teams.
    if current_user.role == "Manager" and team.department != current_user.department:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if current_user.role not in ("Administrator", "Manager"):
        membership = (
            db.query(TeamMember)
            .filter(
                TeamMember.team_id == team_id,
                TeamMember.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    memberships = (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id)
        .all()
    )

    members = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if not user:
            continue
        active_decisions = (
            db.query(Decision)
            .filter(
                Decision.created_by == user.id,
                Decision.status.notin_(["Approved", "Rejected", "Archived"]),
            )
            .all()
        )
        members.append(
            {
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "designation": user.designation,
                "joined_at": m.joined_at,
                "active_decisions": [
                    {
                        "id": d.id,
                        "title": d.title,
                        "status": d.status,
                        "created_at": d.created_at,
                    }
                    for d in active_decisions
                ],
            }
        )

    return {
        "id": team.id,
        "name": team.name,
        "department": team.department,
        "created_at": team.created_at,
        "member_count": len(members),
        "members": members,
    }
