from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.decision import Decision, DecisionCategory, DecisionStatus
from models.version import DecisionVersion
from models.user import User
from Schemas.decision import DecisionCreate, DecisionUpdate, DecisionOut

router = APIRouter(prefix="/decisions", tags=["Decisions"])


def _role_name(user: User) -> Optional[str]:
    return user.role.name if user.role else None


@router.post("", response_model=DecisionOut, status_code=201)
def create_decision(
    payload: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _role_name(current_user) not in ("reviewer", "manager", "administrator"):
        raise HTTPException(
            status_code=403,
            detail="Only a reviewer, manager, or administrator can create decisions",
        )
    decision = Decision(
        title=payload.title,
        problem_statement=payload.problem_statement,
        category=payload.category,
        rationale=payload.rationale,
        created_by_id=current_user.id,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    # Save the initial version snapshot
    snapshot = DecisionVersion(
        decision_id=decision.id,
        version=decision.version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category.value,
        status=decision.status.value,
        rationale=decision.rationale,
        change_summary="Initial creation",
        created_by_id=current_user.id,
    )
    db.add(snapshot)
    db.commit()

    return decision


@router.get("", response_model=List[DecisionOut])
def list_decisions(
    category: Optional[DecisionCategory] = None,
    status: Optional[DecisionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Decision)
    if category:
        query = query.filter(Decision.category == category)
    if status:
        query = query.filter(Decision.status == status)
    return query.order_by(Decision.created_at.desc()).all()


@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.put("/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: int,
    payload: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Only the decision's creator, or a reviewer/manager/administrator, may
    # edit it or change its status. A plain employee cannot alter a decision
    # they didn't create.
    is_creator = decision.created_by_id == current_user.id
    is_privileged = _role_name(current_user) in ("reviewer", "manager", "administrator")
    if not (is_creator or is_privileged):
        raise HTTPException(
            status_code=403,
            detail="Only the creator, a reviewer, a manager, or an administrator can update this decision",
        )

    update_data = payload.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(decision, field, value)

    # Every update bumps the version and stores an immutable snapshot
    decision.version += 1
    db.add(decision)
    db.commit()
    db.refresh(decision)

    snapshot = DecisionVersion(
        decision_id=decision.id,
        version=decision.version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category.value,
        status=decision.status.value,
        rationale=decision.rationale,
        change_summary=payload.change_summary or "Updated",
        created_by_id=current_user.id,
    )
    db.add(snapshot)
    db.commit()

    return decision


@router.delete("/{decision_id}", status_code=204)
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Deleting a decision permanently erases institutional history, so only
    # an administrator can do it. Everyone else should archive it instead
    # (PUT status=Archived) rather than delete.
    if _role_name(current_user) != "administrator":
        raise HTTPException(
            status_code=403,
            detail="Only an administrator can delete a decision. Consider archiving it instead.",
        )

    db.delete(decision)
    db.commit()
    return None
