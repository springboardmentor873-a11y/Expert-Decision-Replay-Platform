from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.decision import Decision
from models.version import DecisionVersion
from models.user import User
from Schemas.version import DecisionVersionOut

router = APIRouter(prefix="/decisions/{decision_id}/versions", tags=["Version Tracking"])


@router.get("", response_model=List[DecisionVersionOut])
def list_versions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return (
        db.query(DecisionVersion)
        .filter(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version.asc())
        .all()
    )
