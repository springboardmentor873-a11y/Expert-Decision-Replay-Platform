from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.alternative import Alternative
from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.alternative import AlternativeCreateRequest, AlternativeUpdateRequest
from app.services.decision_service import get_decision_by_id


def get_alternatives(
    db: Session,
    decision_id: int,
    current_user: User
) -> List[Alternative]:
    """
    Retrieves all alternatives for a decision.
    User must have permission to view the parent decision.
    """
    # Validates parent decision existence and read permissions
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    return (
        db.query(Alternative)
        .filter(Alternative.decision_id == decision_id)
        .order_by(Alternative.id.asc())
        .all()
    )


def get_alternative_by_id(
    db: Session,
    decision_id: int,
    alternative_id: int,
    current_user: User
) -> Alternative:
    """
    Retrieves a specific alternative by its ID and parent decision ID.
    """
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    alternative = (
        db.query(Alternative)
        .filter(Alternative.id == alternative_id, Alternative.decision_id == decision_id)
        .first()
    )
    if not alternative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alternative with ID {alternative_id} not found for decision {decision_id}."
        )

    return alternative


def create_alternative(
    db: Session,
    decision_id: int,
    alternative_in: AlternativeCreateRequest,
    current_user: User
) -> Alternative:
    """
    Creates a new alternative for a decision.
    Only the decision owner (when Draft) or an Administrator can add alternatives.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to add alternatives to this decision."
        )

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add alternatives to a decision in '{decision.status}' status."
        )

    # If this alternative is marked as selected, unselect any other alternatives for this decision
    if alternative_in.is_selected:
        db.query(Alternative).filter(
            Alternative.decision_id == decision_id,
            Alternative.is_selected == True
        ).update({"is_selected": False})

    alternative = Alternative(
        decision_id=decision_id,
        name=alternative_in.name.strip(),
        description=alternative_in.description.strip(),
        pros=alternative_in.pros.strip(),
        cons=alternative_in.cons.strip(),
        cost=alternative_in.cost.strip() if alternative_in.cost else None,
        feasibility=alternative_in.feasibility.strip() if alternative_in.feasibility else None,
        risk_assessment=alternative_in.risk_assessment.strip() if alternative_in.risk_assessment else None,
        is_selected=bool(alternative_in.is_selected),
    )

    db.add(alternative)
    db.commit()
    db.refresh(alternative)
    return alternative


def update_alternative(
    db: Session,
    decision_id: int,
    alternative_id: int,
    alternative_in: AlternativeUpdateRequest,
    current_user: User
) -> Alternative:
    """
    Updates an existing alternative.
    Only the decision owner (when Draft) or an Administrator can update alternatives.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    alternative = (
        db.query(Alternative)
        .filter(Alternative.id == alternative_id, Alternative.decision_id == decision_id)
        .first()
    )
    if not alternative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alternative with ID {alternative_id} not found for decision {decision_id}."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to modify alternatives of this decision."
        )

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot modify alternatives of a decision in '{decision.status}' status."
        )

    # Handle single selected alternative logic
    if alternative_in.is_selected is True:
        db.query(Alternative).filter(
            Alternative.decision_id == decision_id,
            Alternative.id != alternative_id,
            Alternative.is_selected == True
        ).update({"is_selected": False})

    if alternative_in.name is not None:
        alternative.name = alternative_in.name.strip()
    if alternative_in.description is not None:
        alternative.description = alternative_in.description.strip()
    if alternative_in.pros is not None:
        alternative.pros = alternative_in.pros.strip()
    if alternative_in.cons is not None:
        alternative.cons = alternative_in.cons.strip()
    if alternative_in.cost is not None:
        alternative.cost = alternative_in.cost.strip() if alternative_in.cost else None
    if alternative_in.feasibility is not None:
        alternative.feasibility = alternative_in.feasibility.strip() if alternative_in.feasibility else None
    if alternative_in.risk_assessment is not None:
        alternative.risk_assessment = alternative_in.risk_assessment.strip() if alternative_in.risk_assessment else None
    if alternative_in.is_selected is not None:
        alternative.is_selected = bool(alternative_in.is_selected)

    db.commit()
    db.refresh(alternative)
    return alternative


def delete_alternative(
    db: Session,
    decision_id: int,
    alternative_id: int,
    current_user: User
) -> None:
    """
    Deletes an alternative.
    Only the decision owner (when Draft) or an Administrator can delete alternatives.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    alternative = (
        db.query(Alternative)
        .filter(Alternative.id == alternative_id, Alternative.decision_id == decision_id)
        .first()
    )
    if not alternative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alternative with ID {alternative_id} not found for decision {decision_id}."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete alternatives of this decision."
        )

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete alternatives of a decision in '{decision.status}' status."
        )

    db.delete(alternative)
    db.commit()