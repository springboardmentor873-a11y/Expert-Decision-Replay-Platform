from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.decision import Decision
from models.alternative import Alternative
from models.user import User
from Schemas.alternative import AlternativeCreate, AlternativeOut

router = APIRouter(prefix="/decisions/{decision_id}/alternatives", tags=["Alternatives"])


def _recompute_recommendation(db: Session, decision_id: int):
    """After any change, mark the alternative with the highest composite_score as recommended."""
    alternatives = db.query(Alternative).filter(Alternative.decision_id == decision_id).all()
    if not alternatives:
        return
    best = max(alternatives, key=lambda a: a.composite_score)
    for alt in alternatives:
        alt.is_recommended = 1 if alt.id == best.id else 0
        db.add(alt)
    db.commit()


@router.post("", response_model=AlternativeOut, status_code=201)
def add_alternative(
    decision_id: int,
    payload: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternative = Alternative(decision_id=decision_id, **payload.model_dump())
    db.add(alternative)
    db.commit()
    db.refresh(alternative)

    _recompute_recommendation(db, decision_id)
    db.refresh(alternative)
    return alternative


@router.get("", response_model=List[AlternativeOut])
def list_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return (
        db.query(Alternative)
        .filter(Alternative.decision_id == decision_id)
        .order_by(Alternative.created_at.asc())
        .all()
    )
