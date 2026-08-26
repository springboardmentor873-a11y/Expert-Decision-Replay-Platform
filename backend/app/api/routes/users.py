from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.database import get_db
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.user import UserResponse, UserRoleUpdateRequest, UserStatusUpdateRequest
from app.services.user_service import (
    get_all_users,
    get_user_by_id,
    update_user_role,
    update_user_status,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List all users",
    description="Retrieves a list of all registered users. Restricted to Administrator role only.",
)
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
):
    """Returns list of all users with safe profile payloads. Requires Administrator role."""
    users = get_all_users(db, skip=skip, limit=limit)
    return users


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID",
    description="Retrieves user details. Accessible by Administrator or the user accessing their own profile.",
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves user profile. Users can access their own profile; Administrators can access any."""
    is_admin = current_user.role and current_user.role.name == RoleEnum.ADMINISTRATOR.value
    if current_user.id != user_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only access your own profile.",
        )

    user = get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )
    return user


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user active status",
    description="Activates or deactivates a user account. Restricted to Administrator role only.",
)
def patch_user_status(
    user_id: int,
    status_in: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
):
    """Activates or deactivates a user account. Requires Administrator role."""
    updated_user = update_user_status(db, user_id=user_id, is_active=status_in.is_active)
    return updated_user


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user role",
    description="Changes a user's assigned system role. Restricted to Administrator role only.",
)
def patch_user_role(
    user_id: int,
    role_in: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
):
    """Changes a user's assigned system role. Requires Administrator role."""
    updated_user = update_user_role(db, user_id=user_id, new_role=role_in.role)
    return updated_user