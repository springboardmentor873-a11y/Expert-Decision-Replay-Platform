import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.team import Team
from app.models.user import User, UserRole
from app.schemas.team import TeamAssign
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/{user_id}/role", response_model=UserOut)
async def change_role(
    user_id: uuid.UUID,
    new_role: UserRole,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMINISTRATOR)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}/team", response_model=UserOut)
async def assign_user_team(
    user_id: uuid.UUID,
    payload: TeamAssign,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER, UserRole.ADMINISTRATOR)),
):
    """Assign a user to a team (one team per user).

    If the user is already on a different team, moving them requires the
    caller to opt in with `confirm_reassignment: true` — it never happens
    silently.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    team_result = await db.execute(select(Team).where(Team.id == payload.team_id))
    team = team_result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found.")

    if user.team_id is not None and user.team_id != payload.team_id and not payload.confirm_reassignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already on a team. Pass confirm_reassignment=true to move them.",
        )

    user.team_id = team.id
    await db.commit()
    await db.refresh(user)
    return user
