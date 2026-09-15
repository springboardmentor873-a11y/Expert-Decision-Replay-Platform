from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alternative, Decision, User
from app.security.jwt import get_current_user
from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeResponse,
    AlternativeUpdate,
)


router = APIRouter(
    prefix="/decisions/{decision_id}/alternatives",
    tags=["Alternatives"]
)


@router.post("/", response_model=AlternativeResponse)
def create_alternative(
    decision_id: int,
    alternative: AlternativeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check whether the decision exists
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    # Create alternative
    new_alternative = Alternative(
        decision_id=decision_id,
        name=alternative.name,
        description=alternative.description,
        pros=alternative.pros,
        cons=alternative.cons
    )

    db.add(new_alternative)
    db.commit()
    db.refresh(new_alternative)

    return new_alternative


@router.get("/", response_model=list[AlternativeResponse])
def get_alternatives(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check whether the decision exists
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    alternatives = (
        db.query(Alternative)
        .filter(Alternative.decision_id == decision_id)
        .all()
    )

    return alternatives


@router.get("/{alternative_id}", response_model=AlternativeResponse)
def get_alternative(
    decision_id: int,
    alternative_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alternative = (
        db.query(Alternative)
        .filter(
            Alternative.id == alternative_id,
            Alternative.decision_id == decision_id
        )
        .first()
    )

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    return alternative


@router.put("/{alternative_id}", response_model=AlternativeResponse)
def update_alternative(
    decision_id: int,
    alternative_id: int,
    alternative_data: AlternativeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alternative = (
        db.query(Alternative)
        .filter(
            Alternative.id == alternative_id,
            Alternative.decision_id == decision_id
        )
        .first()
    )

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    if alternative_data.name is not None:
        alternative.name = alternative_data.name

    if alternative_data.description is not None:
        alternative.description = alternative_data.description

    if alternative_data.pros is not None:
        alternative.pros = alternative_data.pros

    if alternative_data.cons is not None:
        alternative.cons = alternative_data.cons

    db.commit()
    db.refresh(alternative)

    return alternative


@router.delete("/{alternative_id}")
def delete_alternative(
    decision_id: int,
    alternative_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alternative = (
        db.query(Alternative)
        .filter(
            Alternative.id == alternative_id,
            Alternative.decision_id == decision_id
        )
        .first()
    )

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    db.delete(alternative)
    db.commit()

    return {
        "message": "Alternative deleted successfully"
    }