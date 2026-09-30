import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.team import Team
from app.models.user import User, UserRole
from app.schemas.team import (
    TeamCreate,
    TeamDetailOut,
    TeamJoinRequestAdminOut,
    TeamJoinRequestOut,
    TeamOut,
)
from app.services.team_join_service import (
    approve_request,
    create_join_request,
    list_my_requests,
    list_pending_requests,
    reject_request,
)
from app.services.team_service import get_team_detail, list_teams

router = APIRouter(prefix="/api/v1/teams", tags=["teams"])


@router.get("", response_model=list[TeamOut])
async def get_teams(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Every authenticated user can browse the organization's teams."""
    return await list_teams(db)


@router.get("/my-team", response_model=TeamDetailOut)
async def get_my_team(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The single team the logged-in user belongs to (by their team_id)."""
    if current_user.team_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not assigned to a team yet.",
        )
    return await get_team_detail(db, current_user.team_id)


@router.get("/my-join-requests", response_model=list[TeamJoinRequestOut])
async def get_my_join_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_my_requests(db, user_id=current_user.id)


@router.get("/join-requests", response_model=list[TeamJoinRequestAdminOut])
async def get_join_requests(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    return await list_pending_requests(db)


@router.post("/join-requests/{request_id}/approve", response_model=TeamJoinRequestOut)
async def approve_join_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    return await approve_request(db, request_id=request_id, reviewer=current_user)


@router.post("/join-requests/{request_id}/reject", response_model=TeamJoinRequestOut)
async def reject_join_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    return await reject_request(db, request_id=request_id, reviewer=current_user)


@router.get("/{team_id}", response_model=TeamDetailOut)
async def get_team(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await get_team_detail(db, team_id)


@router.post("/{team_id}/join", response_model=TeamJoinRequestOut, status_code=status.HTTP_201_CREATED)
async def join_team(
    team_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request to join a team. Does NOT assign membership — approval does."""
    return await create_join_request(db, user=current_user, team_id=team_id)


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    payload: TeamCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    existing = await db.execute(select(Team).where(Team.name == payload.name))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team already exists.")

    team = Team(name=payload.name, description=payload.description)
    db.add(team)
    await db.commit()
    await db.refresh(team)

    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "created_at": team.created_at,
        "member_count": 0,
        "decision_count": 0,
    }