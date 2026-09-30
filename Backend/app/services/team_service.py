"""
Team queries.

Member counts, decision counts, member lists, and recent decisions are all
computed from the existing `users` and `decisions` tables — the `teams` table
is deliberately untouched. No function here commits; callers own the
transaction.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decision import Decision
from app.models.team import Team
from app.models.user import User

RECENT_DECISIONS_LIMIT = 5


async def get_team_or_404(db: AsyncSession, team_id: uuid.UUID) -> Team:
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")
    return team


async def _team_counts(db: AsyncSession) -> dict[uuid.UUID, int]:
    """Map team_id -> number of members, computed in one grouped query."""
    result = await db.execute(
        select(User.team_id, func.count()).where(User.team_id.is_not(None)).group_by(User.team_id)
    )
    return {team_id: n for team_id, n in result.all()}


async def _team_decision_counts(db: AsyncSession) -> dict[uuid.UUID, int]:
    """Map team_id -> number of decisions, computed in one grouped query."""
    result = await db.execute(
        select(Decision.team_id, func.count())
        .where(Decision.team_id.is_not(None))
        .group_by(Decision.team_id)
    )
    return {team_id: n for team_id, n in result.all()}


async def list_teams(db: AsyncSession) -> list[dict]:
    """All teams ordered by name, each with live member and decision counts."""
    teams = (await db.execute(select(Team).order_by(Team.name))).scalars().all()
    member_counts = await _team_counts(db)
    decision_counts = await _team_decision_counts(db)
    return [
        {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "created_at": team.created_at,
            "member_count": member_counts.get(team.id, 0),
            "decision_count": decision_counts.get(team.id, 0),
        }
        for team in teams
    ]


async def get_team_detail(db: AsyncSession, team_id: uuid.UUID) -> dict:
    """Full team payload: summary fields, members (with roles), recent decisions."""
    team = await get_team_or_404(db, team_id)

    members = (
        await db.execute(select(User).where(User.team_id == team.id).order_by(User.full_name))
    ).scalars().all()

    decision_count = (
        await db.execute(select(func.count()).select_from(Decision).where(Decision.team_id == team.id))
    ).scalar_one()

    decisions = (
        await db.execute(
            select(Decision)
            .where(Decision.team_id == team.id)
            .order_by(Decision.created_at.desc())
            .limit(RECENT_DECISIONS_LIMIT)
        )
    ).scalars().all()

    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "created_at": team.created_at,
        "member_count": len(members),
        "decision_count": decision_count,
        "members": members,
        "decisions": decisions,
    }