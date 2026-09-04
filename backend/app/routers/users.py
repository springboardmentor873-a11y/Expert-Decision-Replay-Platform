"""
User management routes.

- GET /users            -> list all users (Administrator only)
- PATCH /users/{id}/role -> change a user's role (Administrator only)
- PATCH /users/{id}/team -> assign a user to a team (Administrator only)
"""

from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.user import UserOut, RoleUpdateRequest, TeamAssignRequest
from app.auth.dependencies import get_current_user, require_role
from app.models.user_model import list_users, update_user_role, update_user_team, get_user_by_id
from app.models.team_model import get_team_by_id

router = APIRouter(prefix="/users", tags=["User Management"])


def _row_to_out(row: dict) -> UserOut:
    return UserOut(
        id=row["id"],
        full_name=row["full_name"],
        email=row["email"],
        role=row["role"],
        team_id=row.get("team_id"),
        team_name=row.get("team_name"),
    )


@router.get("", response_model=list[UserOut])
def get_all_users(current_user: dict = Depends(require_role("Administrator"))):
    """Administrator-only: list every registered user."""
    rows = list_users()
    return [_row_to_out(r) for r in rows]


@router.get("/{user_id}", response_model=UserOut)
def get_single_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """
    A user may view their own profile. Administrators may view anyone's.
    """
    if current_user["id"] != user_id and current_user["role"] != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only view your own profile.",
        )
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return _row_to_out(user)


@router.patch("/{user_id}/role", response_model=UserOut)
def change_user_role(
    user_id: int,
    payload: RoleUpdateRequest,
    current_user: dict = Depends(require_role("Administrator")),
):
    """Administrator-only: change a user's role."""
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    update_user_role(user_id, payload.role)
    updated = get_user_by_id(user_id)
    return _row_to_out(updated)


@router.patch("/{user_id}/team", response_model=UserOut)
def assign_user_team(
    user_id: int,
    payload: TeamAssignRequest,
    current_user: dict = Depends(require_role("Administrator")),
):
    """Administrator-only: assign (or unassign) a user's team."""
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.team_id is not None:
        team = get_team_by_id(payload.team_id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified team_id does not exist.",
            )

    update_user_team(user_id, payload.team_id)
    updated = get_user_by_id(user_id)
    return _row_to_out(updated)
