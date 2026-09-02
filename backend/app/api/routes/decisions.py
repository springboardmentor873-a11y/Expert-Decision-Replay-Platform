from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.decision import DecisionCreateRequest, DecisionResponse, DecisionUpdateRequest
from app.services.decision_service import (
    create_decision,
    delete_decision,
    get_decision_by_id,
    get_decisions,
    submit_decision,
    update_decision,
)

router = APIRouter()


@router.post("", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED, summary="Create a new decision")
def create_new_decision(
    decision_in: DecisionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new decision for the authenticated user with initial status 'Draft'."""
    return create_decision(db=db, decision_in=decision_in, user_id=current_user.id)


@router.get("", response_model=List[DecisionResponse], summary="List accessible decisions")
def list_decisions(
    status: Optional[str] = Query(None, description="Filter decisions by status (Draft, Submitted, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves decisions accessible to the authenticated user."""
    return get_decisions(db=db, current_user=current_user, status_filter=status, skip=skip, limit=limit)


@router.get("/{decision_id}", response_model=DecisionResponse, summary="Get decision by ID")
def get_single_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves details of a specific decision by ID."""
    return get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)


@router.patch("/{decision_id}", response_model=DecisionResponse, summary="Update a decision")
def patch_decision(
    decision_id: int,
    decision_in: DecisionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates fields of an existing decision."""
    return update_decision(db=db, decision_id=decision_id, decision_in=decision_in, current_user=current_user)


@router.post("/{decision_id}/submit", response_model=DecisionResponse, summary="Submit a draft decision")
def submit_draft_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transitions a decision status from 'Draft' to 'Submitted'."""
    return submit_decision(db=db, decision_id=decision_id, current_user=current_user)


@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a decision")
def remove_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a draft decision (or any decision for Administrators)."""
    delete_decision(db=db, decision_id=decision_id, current_user=current_user)
    return None