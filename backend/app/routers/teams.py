"""
Basic team management routes.

- GET  /teams   -> any authenticated user can view the list of teams
- POST /teams   -> Administrator or Manager can create a new team
"""

from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.user import TeamOut, TeamCreate
from app.auth.dependencies import get_current_user, require_role
from app.models.team_model import create_team, list_teams, get_team_by_name

router = APIRouter(prefix="/teams", tags=["Team Management"])


@router.get("", response_model=list[TeamOut])
def get_all_teams(current_user: dict = Depends(get_current_user)):
    """Any authenticated user can view the list of teams."""
    rows = list_teams()
    return [
        TeamOut(
            id=r["id"],
            team_name=r["team_name"],
            manager_id=r.get("manager_id"),
            manager_name=r.get("manager_name"),
            created_at=str(r["created_at"]) if r.get("created_at") else None,
        )
        for r in rows
    ]


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def add_team(
    payload: TeamCreate,
    current_user: dict = Depends(require_role("Administrator", "Manager")),
):
    """Administrators and Managers can create a new team."""
    existing = get_team_by_name(payload.team_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A team with this name already exists.",
        )

    new_id = create_team(payload.team_name, payload.manager_id)
    rows = [r for r in list_teams() if r["id"] == new_id]
    row = rows[0] if rows else {"id": new_id, "team_name": payload.team_name,
                                 "manager_id": payload.manager_id, "manager_name": None,
                                 "created_at": None}
    return TeamOut(
        id=row["id"],
        team_name=row["team_name"],
        manager_id=row.get("manager_id"),
        manager_name=row.get("manager_name"),
        created_at=str(row["created_at"]) if row.get("created_at") else None,
    )
