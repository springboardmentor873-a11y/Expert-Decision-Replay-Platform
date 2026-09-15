from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Decision, DecisionVersion, User, AuditLog
from app.schemas.decision import (
    DecisionCreate,
    DecisionUpdate,
    DecisionResponse
)
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/decisions",
    tags=["Decisions"]
)


@router.post(
    "/",
    response_model=DecisionResponse
)
def create_decision(
    decision: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_decision = Decision(
        title=decision.title,
        description=decision.description,
        status=decision.status,
        priority=decision.priority,
        owner_id=current_user.id
    )

    db.add(new_decision)

    audit_log = AuditLog(
        user_id=current_user.id,
        action="Created",
        entity_type="Decision",
        entity_id=new_decision.id,
        description=f'Decision "{new_decision.title}" was created.'
    )


    db.add(audit_log)
    db.commit()
    db.refresh(new_decision)

    # Create initial version
    initial_version = DecisionVersion(
        decision_id=new_decision.id,
        version_number=1,
        title=new_decision.title,
        description=new_decision.description,
        status=new_decision.status,
        priority=new_decision.priority,
        changed_by=current_user.id
    )

    db.add(initial_version)
    db.commit()

    return new_decision


@router.get(
    "/",
    response_model=list[DecisionResponse]
)
def get_all_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decisions = (
        db.query(Decision)
        .order_by(Decision.created_at.desc())
        .all()
    )

    return decisions


@router.get(
    "/{decision_id}",
    response_model=DecisionResponse
)
def get_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    return decision


@router.put(
    "/{decision_id}",
    response_model=DecisionResponse
)
def update_decision(
    decision_id: int,
    decision_data: DecisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    if decision.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this decision"
        )

    # Update decision
    if decision_data.title is not None:
        decision.title = decision_data.title

    if decision_data.description is not None:
        decision.description = decision_data.description

    if decision_data.status is not None:
        decision.status = decision_data.status

    if decision_data.priority is not None:
        decision.priority = decision_data.priority

    # Find the latest version number
    latest_version = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision_id
        )
        .order_by(
            DecisionVersion.version_number.desc()
        )
        .first()
    )

    if latest_version:
        next_version_number = latest_version.version_number + 1
    else:
        next_version_number = 1

    # Create a snapshot of the updated decision
    new_version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version_number,
        title=decision.title,
        description=decision.description,
        status=decision.status,
        priority=decision.priority,
        changed_by=current_user.id
    )

    db.add(new_version)

    db.commit()
    db.refresh(decision)

    return decision


@router.delete(
    "/{decision_id}"
)
def delete_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    if decision.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this decision"
        )

    db.delete(decision)
    db.commit()

    return {
        "message": "Decision deleted successfully"
    }