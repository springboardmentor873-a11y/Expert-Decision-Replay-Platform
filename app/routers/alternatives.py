from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.alternative import Alternative
from app.models.decision import Decision
from app.models.user import User
from app.schemas.alternative import (
    AlternativeCreate,
    AlternativeResponse,
    AlternativeUpdate,
)
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision


router = APIRouter(
    tags=["Alternatives"]
)


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


# CREATE ALTERNATIVE
@router.post(
    "/decisions/{decision_id}/alternatives",
    response_model=AlternativeResponse,
    status_code=status.HTTP_201_CREATED
)
def create_alternative(
    decision_id: int,
    alternative_data: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    alternative = Alternative(
        decision_id=decision_id,
        name=alternative_data.name,
        description=alternative_data.description,
        pros=alternative_data.pros,
        cons=alternative_data.cons,
        estimated_cost=alternative_data.estimated_cost,
        feasibility_score=alternative_data.feasibility_score,
        risk_level=alternative_data.risk_level.value
    )

    db.add(alternative)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.ALTERNATIVE,
        entity_id=alternative.id,
        description=(
            f"User {current_user.id} created "
            f"Alternative {alternative.id} "
            f"for Decision {decision_id}"
        ),
        new_value={
            "name": alternative.name,
            "description": alternative.description,
            "pros": alternative.pros,
            "cons": alternative.cons,
            "estimated_cost": alternative.estimated_cost,
            "feasibility_score": alternative.feasibility_score,
            "risk_level": alternative.risk_level
        },
        request_method="POST",
        endpoint=f"/decisions/{decision_id}/alternatives"
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Alternative Added",
        entity_type="Alternative",
        entity_id=alternative.id,
        description=f"{current_user.full_name} added alternative '{alternative.name}'"
    )

    db.commit()
    db.refresh(alternative)

    return alternative


# GET ALL ALTERNATIVES FOR A DECISION
@router.get(
    "/decisions/{decision_id}/alternatives",
    response_model=List[AlternativeResponse]
)
def get_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    return (
        db.query(Alternative)
        .filter(
            Alternative.decision_id == decision_id
        )
        .all()
    )


# GET ALTERNATIVE BY ID
@router.get(
    "/alternatives/{alternative_id}",
    response_model=AlternativeResponse
)
def get_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alternative = db.query(Alternative).filter(
        Alternative.id == alternative_id
    ).first()

    if not alternative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alternative not found"
        )

    decision = _get_decision_or_404(db, alternative.decision_id)
    assert_can_access_decision(current_user, decision, db)

    return alternative


# UPDATE ALTERNATIVE
@router.put(
    "/alternatives/{alternative_id}",
    response_model=AlternativeResponse
)
def update_alternative(
    alternative_id: int,
    alternative_data: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alternative = db.query(Alternative).filter(
        Alternative.id == alternative_id
    ).first()

    if not alternative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alternative not found"
        )

    decision = _get_decision_or_404(db, alternative.decision_id)
    assert_can_access_decision(current_user, decision, db)

    old_values = {
        "name": alternative.name,
        "description": alternative.description,
        "pros": alternative.pros,
        "cons": alternative.cons,
        "estimated_cost": alternative.estimated_cost,
        "feasibility_score": alternative.feasibility_score,
        "risk_level": alternative.risk_level
    }

    alternative.name = alternative_data.name
    alternative.description = alternative_data.description
    alternative.pros = alternative_data.pros
    alternative.cons = alternative_data.cons
    alternative.estimated_cost = alternative_data.estimated_cost
    alternative.feasibility_score = alternative_data.feasibility_score
    alternative.risk_level = alternative_data.risk_level.value

    new_values = {
        "name": alternative.name,
        "description": alternative.description,
        "pros": alternative.pros,
        "cons": alternative.cons,
        "estimated_cost": alternative.estimated_cost,
        "feasibility_score": alternative.feasibility_score,
        "risk_level": alternative.risk_level
    }

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.ALTERNATIVE,
        entity_id=alternative.id,
        description=(
            f"User {current_user.id} updated "
            f"Alternative {alternative.id}"
        ),
        old_value=old_values,
        new_value=new_values,
        request_method="PUT",
        endpoint=f"/alternatives/{alternative.id}"
    )

    db.commit()
    db.refresh(alternative)

    return alternative


# DELETE ALTERNATIVE
@router.delete(
    "/alternatives/{alternative_id}",
    status_code=status.HTTP_200_OK
)
def delete_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alternative = db.query(Alternative).filter(
        Alternative.id == alternative_id
    ).first()

    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    decision = _get_decision_or_404(db, alternative.decision_id)
    assert_can_access_decision(current_user, decision, db)

    if decision.created_by != current_user.id and current_user.role not in (
        "Manager",
        "Administrator",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the decision owner, a Manager or an Administrator can delete alternatives",
        )

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.DELETE,
        entity_type=AuditEntityType.ALTERNATIVE,
        entity_id=alternative.id,
        description=f"User {current_user.id} deleted Alternative {alternative.id}",
        request_method="DELETE",
        endpoint=f"/alternatives/{alternative_id}",
    )

    db.delete(alternative)
    db.commit()

    return {"message": "Alternative deleted successfully"}


# MARK ALTERNATIVE AS SELECTED
@router.patch(
    "/alternatives/{alternative_id}/select",
    response_model=AlternativeResponse
)
def select_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks this alternative as the selected/preferred option and
    clears the is_selected flag on all other alternatives for the
    same decision. Only the decision owner, a Manager, or an
    Administrator may select.
    """
    alternative = db.query(Alternative).filter(
        Alternative.id == alternative_id
    ).first()

    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    decision = _get_decision_or_404(db, alternative.decision_id)
    assert_can_access_decision(current_user, decision, db)

    if decision.created_by != current_user.id and current_user.role not in (
        "Manager",
        "Administrator",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the decision owner, a Manager or an Administrator can select an alternative",
        )

    # Clear selection on siblings
    db.query(Alternative).filter(
        Alternative.decision_id == alternative.decision_id,
        Alternative.id != alternative_id
    ).update({"is_selected": False})

    alternative.is_selected = True

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.ALTERNATIVE,
        entity_id=alternative.id,
        description=(
            f"Alternative '{alternative.name}' marked as selected "
            f"for decision '{decision.title}'"
        ),
        request_method="PATCH",
        endpoint=f"/alternatives/{alternative_id}/select"
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Alternative Selected",
        entity_type="Alternative",
        entity_id=alternative.id,
        description=f"{current_user.full_name} selected alternative '{alternative.name}' as preferred"
    )

    db.commit()
    db.refresh(alternative)
    return alternative


# COMPARE ALTERNATIVES
@router.get(
    "/decisions/{decision_id}/alternatives/compare"
)
def compare_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    alternatives = db.query(Alternative).filter(
        Alternative.decision_id == decision_id
    ).all()

    return {
        "decision_id": decision_id,
        "alternatives": [
            {
                "id": alternative.id,
                "name": alternative.name,
                "estimated_cost": alternative.estimated_cost,
                "feasibility_score": alternative.feasibility_score,
                "risk_level": alternative.risk_level
            }
            for alternative in alternatives
        ]
    }
