"""
Team join request workflow.

Creating a request never touches `users.team_id` — membership happens only
when a Manager/Administrator approves it. Rejecting leaves the user unassigned.
"""
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team import Team
from app.models.team_join_request import TeamJoinRequest, TeamJoinRequestStatus
from app.models.user import User
from app.services.notification_service import (
    notify_team_join_approved,
    notify_team_join_rejected,
    notify_team_join_requested,
)


async def get_request_or_404(db: AsyncSession, request_id: uuid.UUID) -> TeamJoinRequest:
    result = await db.execute(
        select(TeamJoinRequest)
        .where(TeamJoinRequest.id == request_id)
        .options(selectinload(TeamJoinRequest.user), selectinload(TeamJoinRequest.team))
    )
    request = result.scalar_one_or_none()
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found."
        )
    return request


async def create_join_request(
    db: AsyncSession, *, user: User, team_id: uuid.UUID
) -> TeamJoinRequest:
    if user.team_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already belong to a team and cannot request to join another.",
        )

    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    existing = await db.execute(
        select(TeamJoinRequest).where(
            TeamJoinRequest.user_id == user.id,
            TeamJoinRequest.team_id == team_id,
            TeamJoinRequest.status == TeamJoinRequestStatus.PENDING,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending request to join this team.",
        )

    request = TeamJoinRequest(user_id=user.id, team_id=team_id)
    db.add(request)
    await db.flush()  # so request.id exists before we reference it below

    await notify_team_join_requested(db, requester=user, team_name=team.name)
    await db.commit()
    await db.refresh(request)
    return request


async def list_my_requests(db: AsyncSession, *, user_id: uuid.UUID) -> list[TeamJoinRequest]:
    result = await db.execute(
        select(TeamJoinRequest)
        .where(TeamJoinRequest.user_id == user_id)
        .order_by(TeamJoinRequest.created_at.desc())
    )
    return result.scalars().all()


async def list_pending_requests(db: AsyncSession) -> list[dict]:
    """Manager/Admin view: every pending request with requester + team names."""
    result = await db.execute(
        select(TeamJoinRequest)
        .where(TeamJoinRequest.status == TeamJoinRequestStatus.PENDING)
        .options(selectinload(TeamJoinRequest.user), selectinload(TeamJoinRequest.team))
        .order_by(TeamJoinRequest.created_at.desc())
    )
    requests = result.scalars().all()
    return [
        {
            "id": request.id,
            "user_id": request.user_id,
            "team_id": request.team_id,
            "status": request.status,
            "requester_name": request.user.full_name,
            "requester_email": request.user.email,
            "team_name": request.team.name,
            "created_at": request.created_at,
            "reviewed_at": request.reviewed_at,
            "reviewed_by": request.reviewed_by,
        }
        for request in requests
    ]


async def approve_request(
    db: AsyncSession, *, request_id: uuid.UUID, reviewer: User
) -> TeamJoinRequest:
    request = await get_request_or_404(db, request_id)

    if request.status != TeamJoinRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve a request with status '{request.status.value}'.",
        )

    if request.user.team_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requester already belongs to a team, so this request cannot be approved.",
        )

    request.user.team_id = request.team_id
    request.status = TeamJoinRequestStatus.APPROVED
    request.reviewed_by = reviewer.id
    request.reviewed_at = datetime.now(timezone.utc)

    await notify_team_join_approved(
        db,
        user_id=request.user_id,
        team_name=request.team.name,
        reviewed_by_name=reviewer.full_name,
    )
    await db.commit()
    await db.refresh(request)
    return request


async def reject_request(
    db: AsyncSession, *, request_id: uuid.UUID, reviewer: User
) -> TeamJoinRequest:
    request = await get_request_or_404(db, request_id)

    if request.status != TeamJoinRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reject a request with status '{request.status.value}'.",
        )

    request.status = TeamJoinRequestStatus.REJECTED
    request.reviewed_by = reviewer.id
    request.reviewed_at = datetime.now(timezone.utc)

    await notify_team_join_rejected(
        db,
        user_id=request.user_id,
        team_name=request.team.name,
        reviewed_by_name=reviewer.full_name,
    )
    await db.commit()
    await db.refresh(request)
    return request