from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.alternative import (
    AlternativeCreateRequest,
    AlternativeResponse,
    AlternativeUpdateRequest,
)
from app.services.alternative_service import (
    create_alternative,
    delete_alternative,
    get_alternative_by_id,
    get_alternatives,
    update_alternative,
)

router = APIRouter()


@router.post(
    "",
    response_model=AlternativeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new alternative for a decision"
)
def add_decision_alternative(
    decision_id: int,
    alternative_in: AlternativeCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates an alternative evaluation for the given decision.
    Only the decision owner (when Draft) or an Administrator can create alternatives.
    """
    return create_alternative(
        db=db,
        decision_id=decision_id,
        alternative_in=alternative_in,
        current_user=current_user
    )


@router.get(
    "",
    response_model=List[AlternativeResponse],
    summary="List all alternatives for a decision"
)
def list_decision_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all alternatives for the given decision.
    Access matches the visibility of the parent decision.
    """
    return get_alternatives(
        db=db,
        decision_id=decision_id,
        current_user=current_user
    )


@router.get(
    "/{alternative_id}",
    response_model=AlternativeResponse,
    summary="Get alternative details"
)
def get_single_alternative(
    decision_id: int,
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves a single alternative by its ID within the specified decision.
    """
    return get_alternative_by_id(
        db=db,
        decision_id=decision_id,
        alternative_id=alternative_id,
        current_user=current_user
    )


@router.patch(
    "/{alternative_id}",
    response_model=AlternativeResponse,
    summary="Update an alternative"
)
def patch_decision_alternative(
    decision_id: int,
    alternative_id: int,
    alternative_in: AlternativeUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates fields of an alternative.
    Only the decision owner (when Draft) or an Administrator can modify alternatives.
    """
    return update_alternative(
        db=db,
        decision_id=decision_id,
        alternative_id=alternative_id,
        alternative_in=alternative_in,
        current_user=current_user
    )


@router.delete(
    "/{alternative_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an alternative"
)
def remove_decision_alternative(
    decision_id: int,
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes an alternative.
    Only the decision owner (when Draft) or an Administrator can delete alternatives.
    """
    delete_alternative(
        db=db,
        decision_id=decision_id,
        alternative_id=alternative_id,
        current_user=current_user
    )
    return None