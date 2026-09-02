from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest


def create_decision(db: Session, decision_in: DecisionCreateRequest, user_id: int) -> Decision:
    """Creates a new decision with initial status 'Draft' associated with the authenticated user."""
    decision = Decision(
        title=decision_in.title.strip(),
        problem_statement=decision_in.problem_statement.strip(),
        context=decision_in.context.strip(),
        decision_taken=decision_in.decision_taken.strip(),
        reasoning=decision_in.reasoning.strip(),
        expected_outcome=decision_in.expected_outcome.strip() if decision_in.expected_outcome else None,
        actual_outcome=decision_in.actual_outcome.strip() if decision_in.actual_outcome else None,
        status=DecisionStatusEnum.DRAFT.value,
        created_by=user_id,
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


def get_decision_by_id(db: Session, decision_id: int, current_user: User) -> Decision:
    """
    Retrieves a decision by its ID with authorization validation.
    Raises 404 if not found, 403 if user does not have permission.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    # Authorization rules:
    # 1. Administrator can view any decision.
    # 2. Decision owner can view their own decision.
    # 3. Reviewers / Managers can view decisions that are submitted/under review/approved/rejected or their own.
    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value
    is_reviewer_or_manager = user_role in (RoleEnum.REVIEWER.value, RoleEnum.MANAGER.value)

    if not (is_owner or is_admin or (is_reviewer_or_manager and decision.status != DecisionStatusEnum.DRAFT.value)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this decision."
        )

    return decision


def get_decisions(
    db: Session,
    current_user: User,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Decision]:
    """
    Lists decisions accessible to the current user.
    - Administrators view all decisions.
    - Reviewers and Managers view their own decisions and non-draft decisions.
    - Regular Employees view their own decisions.
    """
    user_role = current_user.role.name if current_user.role else ""
    query = db.query(Decision)

    if user_role == RoleEnum.ADMINISTRATOR.value:
        pass  # Admin can see all
    elif user_role in (RoleEnum.REVIEWER.value, RoleEnum.MANAGER.value):
        # Can see own decisions or decisions that are not in Draft status
        query = query.filter(
            (Decision.created_by == current_user.id) |
            (Decision.status != DecisionStatusEnum.DRAFT.value)
        )
    else:
        # Standard user / Employee: only own decisions
        query = query.filter(Decision.created_by == current_user.id)

    if status_filter:
        query = query.filter(Decision.status == status_filter)

    return query.order_by(Decision.updated_at.desc()).offset(skip).limit(limit).all()


def update_decision(
    db: Session,
    decision_id: int,
    decision_in: DecisionUpdateRequest,
    current_user: User
) -> Decision:
    """
    Updates a decision. Only the owner or an Administrator can update a decision.
    Draft decisions can be edited freely. Non-draft decisions have restricted modification.
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
            detail="Forbidden: You do not have permission to modify this decision."
        )

    # If decision is not in draft, prevent normal users from modifying core text
    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        disallowed_fields = [
            field for field in ("title", "problem_statement", "context", "decision_taken", "reasoning")
            if getattr(decision_in, field, None) is not None
        ]
        if disallowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot edit core fields ({', '.join(disallowed_fields)}) of a decision in '{decision.status}' status."
            )

    # Apply updates
    if decision_in.title is not None:
        decision.title = decision_in.title.strip()
    if decision_in.problem_statement is not None:
        decision.problem_statement = decision_in.problem_statement.strip()
    if decision_in.context is not None:
        decision.context = decision_in.context.strip()
    if decision_in.decision_taken is not None:
        decision.decision_taken = decision_in.decision_taken.strip()
    if decision_in.reasoning is not None:
        decision.reasoning = decision_in.reasoning.strip()
    if decision_in.expected_outcome is not None:
        decision.expected_outcome = decision_in.expected_outcome.strip() if decision_in.expected_outcome else None
    if decision_in.actual_outcome is not None:
        decision.actual_outcome = decision_in.actual_outcome.strip() if decision_in.actual_outcome else None
    if decision_in.status is not None:
        status_val = decision_in.status.value if hasattr(decision_in.status, "value") else str(decision_in.status)
        decision.status = status_val

    db.commit()
    db.refresh(decision)
    return decision


def submit_decision(db: Session, decision_id: int, current_user: User) -> Decision:
    """Transitions a decision from Draft to Submitted."""
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
            detail="Forbidden: You do not have permission to submit this decision."
        )

    if decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only draft decisions can be submitted. Current status is '{decision.status}'."
        )

    decision.status = DecisionStatusEnum.SUBMITTED.value
    db.commit()
    db.refresh(decision)
    return decision


def delete_decision(db: Session, decision_id: int, current_user: User) -> None:
    """Deletes a decision. Owner can delete Draft decisions; Administrator can delete any decision."""
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
            detail="Forbidden: You do not have permission to delete this decision."
        )

    # Standard users can only delete Draft decisions
    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete a decision that has already been submitted (Status: '{decision.status}')."
        )

    db.delete(decision)
    db.commit()