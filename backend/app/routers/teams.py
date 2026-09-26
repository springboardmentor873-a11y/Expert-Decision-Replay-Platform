from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Team, User, Decision
from app.schemas.team import (
    TeamCreate,
    TeamResponse,
    TeamOverviewResponse,
)
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


@router.post("/", response_model=TeamResponse)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db)
):
    existing_team = (
        db.query(Team)
        .filter(Team.name == team.name)
        .first()
    )

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="Team already exists"
        )

    new_team = Team(name=team.name)

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team


@router.get("/")
def get_all_teams(
    db: Session = Depends(get_db)
):
    return db.query(Team).all()


@router.get(
    "/overview",
    response_model=list[TeamOverviewResponse]
)
def get_team_overview(
    db: Session = Depends(get_db)
):
    teams = db.query(Team).all()

    result = []

    for team in teams:

        members = team.users

        member_data = [
            {
                "id": user.id,
                "full_name": user.full_name,
                "role_name": user.role_name,
            }
            for user in members
        ]

        member_ids = [user.id for user in members]

        recent_decisions = []

        if member_ids:
            decisions = (
                db.query(Decision)
                .filter(
                    Decision.owner_id.in_(member_ids)
                )
                .order_by(
                    Decision.updated_at.desc()
                )
                .limit(3)
                .all()
            )

            recent_decisions = [
                {
                    "id": decision.id,
                    "title": decision.title,
                    "status": decision.status,
                    "priority": decision.priority,
                    "updated_at": decision.updated_at,
                }
                for decision in decisions
            ]

        result.append(
            {
                "id": team.id,
                "name": team.name,
                "member_count": len(members),
                "status": (
                    "Active"
                    if len(members) > 0
                    else "Available"
                ),
                "members": member_data,
                "recent_decisions": recent_decisions,
            }
        )

    return result


@router.get(
    "/{team_id}",
    response_model=TeamResponse
)
def get_team_by_id(
    team_id: int,
    db: Session = Depends(get_db)
):
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

    return team


@router.get(
    "/{team_id}/members",
    response_model=list[UserResponse]
)
def get_team_members(
    team_id: int,
    db: Session = Depends(get_db)
):
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

    return team.users


@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    db: Session = Depends(get_db)
):
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

    for user in team.users:
        user.team_id = None

    db.delete(team)
    db.commit()

    return {
        "message": "Team deleted successfully"
    }