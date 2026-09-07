from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    AlternativeCreate,
    AlternativeUpdate,
    AlternativeResponse,
    AlternativeComparisonResponse
)
from app.auth import get_current_active_user
from app.services import alternative_service

router = APIRouter(prefix="/decisions", tags=["Alternatives Analysis & Comparison"])

def _to_alt_response(alt) -> AlternativeResponse:
    return AlternativeResponse(
        id=alt.id,
        decision_id=alt.decision_id,
        title=alt.title,
        description=alt.description,
        pros=alt.parsed_pros,
        cons=alt.parsed_cons,
        estimated_cost=alt.estimated_cost or 0.0,
        feasibility_score=alt.feasibility_score or 5,
        risk_assessment=alt.risk_assessment,
        created_at=alt.created_at
    )

@router.post("/{id}/alternatives", response_model=AlternativeResponse, status_code=status.HTTP_201_CREATED)
def add_alternative(
    id: int,
    alt_in: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Append an alternative option (with structured pros, cons, cost, feasibility score, and risk assessment) to a decision.
    """
    alt = alternative_service.add_alternative(db, id, alt_in, current_user)
    return _to_alt_response(alt)

@router.get("/{id}/alternatives", response_model=List[AlternativeResponse])
def get_alternatives(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all alternative options recorded for a given decision.
    """
    alts = alternative_service.get_alternatives(db, id)
    return [_to_alt_response(a) for a in alts]

@router.get("/{id}/alternatives/compare", response_model=AlternativeComparisonResponse)
def compare_alternatives(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a side-by-side comparison matrix and aggregate evaluation metrics for all alternatives.
    """
    return alternative_service.get_alternative_comparison(db, id)

@router.put("/{id}/alternatives/{alt_id}", response_model=AlternativeResponse)
def update_alternative(
    id: int,
    alt_id: int,
    alt_in: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Modify an existing alternative option and update decision version history.
    """
    alt = alternative_service.update_alternative(db, id, alt_id, alt_in, current_user)
    return _to_alt_response(alt)

@router.delete("/{id}/alternatives/{alt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alternative(
    id: int,
    alt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove an alternative option from a decision.
    """
    alternative_service.delete_alternative(db, id, alt_id, current_user)
    return None
