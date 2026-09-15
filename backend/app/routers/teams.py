from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Team
from app.schemas.team import TeamCreate, TeamResponse


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

    new_team = Team(
        name=team.name
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team

@router.get("/")
def get_all_teams(
    db: Session = Depends(get_db)
):
    teams = db.query(Team).all()

    return teams

@router.get("/{team_id}")
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

    db.delete(team)
    db.commit()

    return {
        "message": "Team deleted successfully"
    }

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

    db.delete(team)
    db.commit()

    return {
        "message": "Team deleted successfully"
    }    