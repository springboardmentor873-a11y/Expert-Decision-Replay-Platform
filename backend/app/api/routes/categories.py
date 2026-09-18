from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.category import CategoryCreateRequest, CategoryResponse, CategoryUpdateRequest
from app.core.dependencies import get_current_user, require_roles
from app.services.category_service import (
    create_category,
    delete_category,
    get_categories,
    get_category_by_id,
    update_category,
)

router = APIRouter(tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all categories with decision counts."""
    return get_categories(db)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value]))],
)
def create_new_category(
    category_in: CategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new category (Administrator or Manager only)."""
    return create_category(db, category_in, current_user)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single category details."""
    return get_category_by_id(db, category_id)


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value]))],
)
def update_existing_category(
    category_id: int,
    category_in: CategoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing category (Administrator or Manager only)."""
    return update_category(db, category_id, category_in, current_user)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value]))],
)
def delete_existing_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a category (Administrator or Manager only)."""
    delete_category(db, category_id, current_user)
    return None

