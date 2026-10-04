from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.decision import Decision
from app.models.decision_rationale import DecisionRationale
from app.models.user import User
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision


router = APIRouter(
    prefix="/decisions",
    tags=["Decision Rationale"]
)


class RationaleCreate(BaseModel):
    content: str


class RationaleResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    content: str

    class Config:
        from_attributes = True


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.post(
    "/{decision_id}/rationale",
    response_model=RationaleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_rationale(
    decision_id: int,
    rationale_data: RationaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    existing = db.query(DecisionRationale).filter(
        DecisionRationale.decision_id == decision_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Rationale already exists. Use PUT to update it."
        )

    rationale = DecisionRationale(
        decision_id=decision_id,
        user_id=current_user.id,
        content=rationale_data.content
    )

    db.add(rationale)
    db.flush()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Rationale Recorded",
        entity_type="DecisionRationale",
        entity_id=rationale.id,
        description=f"{current_user.full_name} recorded the rationale for '{decision.title}'"
    )

    db.commit()
    db.refresh(rationale)

    return rationale


@router.put(
    "/{decision_id}/rationale",
    response_model=RationaleResponse
)
def update_rationale(
    decision_id: int,
    rationale_data: RationaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    rationale = db.query(DecisionRationale).filter(
        DecisionRationale.decision_id == decision_id
    ).first()

    if not rationale:
        raise HTTPException(status_code=404, detail="Rationale not found. Create it first.")

    rationale.content = rationale_data.content

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Rationale Updated",
        entity_type="DecisionRationale",
        entity_id=rationale.id,
        description=f"{current_user.full_name} updated the rationale for '{decision.title}'"
    )

    db.commit()
    db.refresh(rationale)

    return rationale


@router.get(
    "/{decision_id}/rationale",
    response_model=RationaleResponse
)
def get_rationale(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    rationale = db.query(DecisionRationale).filter(
        DecisionRationale.decision_id == decision_id
    ).first()

    if not rationale:
        raise HTTPException(
            status_code=404,
            detail="Rationale not found"
        )

    return rationale
