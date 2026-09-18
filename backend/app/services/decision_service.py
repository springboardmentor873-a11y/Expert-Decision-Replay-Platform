from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.models.tag import DecisionTag
from app.models.audit_log import AuditActionEnum
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest
from app.services.decision_version_service import (
    create_initial_version,
    create_version_snapshot,
    generate_change_summary,
)
from app.services.audit_service import create_audit_log


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
        category_id=decision_in.category_id,
        team_id=decision_in.team_id,
        status=DecisionStatusEnum.DRAFT.value,
        created_by=user_id,
    )
    db.add(decision)
    db.flush()

    if decision_in.tag_ids:
        for tid in decision_in.tag_ids:
            dt = DecisionTag(decision_id=decision.id, tag_id=tid)
            db.add(dt)

    create_initial_version(db=db, decision=decision, user_id=user_id)

    create_audit_log(
        db=db,
        action=AuditActionEnum.DECISION_CREATED,
        entity_type="Decision",
        entity_id=decision.id,
        user_id=user_id,
        description=f"Created decision \"{decision.title}\"",
        details={
            "decision_id": decision.id,
            "title": decision.title,
            "status": decision.status,
            "created_by": user_id,
        },
        skip_commit=True,
    )

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
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    team_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Decision]:
    """
    Lists decisions accessible to the current user with filtering and multi-field search.
    """
    user_role = current_user.role.name if current_user.role else ""
    query = db.query(Decision)

    if user_role == RoleEnum.ADMINISTRATOR.value:
        pass  # Admin can see all
    elif user_role in (RoleEnum.REVIEWER.value, RoleEnum.MANAGER.value):
        query = query.filter(
            (Decision.created_by == current_user.id) |
            (Decision.status != DecisionStatusEnum.DRAFT.value)
        )
    else:
        query = query.filter(Decision.created_by == current_user.id)

    if isinstance(status_filter, str) and status_filter.strip():
        query = query.filter(Decision.status == status_filter.strip())

    if isinstance(category_id, int):
        query = query.filter(Decision.category_id == category_id)

    if isinstance(team_id, int):
        query = query.filter(Decision.team_id == team_id)

    if isinstance(tag_id, int):
        query = query.join(Decision.tags).filter(DecisionTag.tag_id == tag_id)

    if isinstance(search, str) and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Decision.title.ilike(term),
                Decision.problem_statement.ilike(term),
                Decision.context.ilike(term),
                Decision.decision_taken.ilike(term),
                Decision.reasoning.ilike(term),
                Decision.status.ilike(term),
            )
        )

    return query.order_by(Decision.updated_at.desc()).offset(skip).limit(limit).all()


def update_decision(
    db: Session,
    decision_id: int,
    decision_in: DecisionUpdateRequest,
    current_user: User
) -> Decision:
    """
    Updates a decision. Enforces read-only protection for Archived decisions.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    # Read-only check for Archived decisions
    if decision.status == DecisionStatusEnum.ARCHIVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify an archived decision. Please unarchive it first."
        )

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = user_role == RoleEnum.ADMINISTRATOR.value

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to modify this decision."
        )

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        disallowed_fields = [
            field for field in ("title", "problem_statement", "context", "decision_taken", "reasoning")
            if getattr(decision_in, field, None) is not None
        ]
        if disallowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot edit core fields ({', '.join(disallowed_fields)}) once a decision has been submitted."
            )

    old_values = {
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "context": decision.context,
        "decision_taken": decision.decision_taken,
        "reasoning": decision.reasoning,
        "expected_outcome": decision.expected_outcome,
        "actual_outcome": decision.actual_outcome,
        "status": decision.status,
    }

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
    if decision_in.category_id is not None:
        decision.category_id = decision_in.category_id
    if decision_in.team_id is not None:
        decision.team_id = decision_in.team_id

    if decision_in.tag_ids is not None:
        db.query(DecisionTag).filter(DecisionTag.decision_id == decision.id).delete()
        for tid in decision_in.tag_ids:
            dt = DecisionTag(decision_id=decision.id, tag_id=tid)
            db.add(dt)

    new_values = {
        "title": decision.title,
        "problem_statement": decision.problem_statement,
        "context": decision.context,
        "decision_taken": decision.decision_taken,
        "reasoning": decision.reasoning,
        "expected_outcome": decision.expected_outcome,
        "actual_outcome": decision.actual_outcome,
        "status": decision.status,
    }
    change_summary = generate_change_summary(old_values, new_values)
    if change_summary:
        create_version_snapshot(
            db=db,
            decision=decision,
            changed_by=current_user.id,
            change_summary=change_summary,
        )
        from app.services.notification_service import notify_decision_updated
        notify_decision_updated(db=db, decision=decision, actor=current_user, change_summary=change_summary)

        create_audit_log(
            db=db,
            action=AuditActionEnum.DECISION_UPDATED,
            entity_type="Decision",
            entity_id=decision.id,
            user_id=current_user.id,
            description=f"Updated decision \"{decision.title}\" ({change_summary})",
            details={
                "decision_id": decision.id,
                "change_summary": change_summary,
                "updated_by": current_user.id,
            },
            skip_commit=True,
        )

    db.commit()
    db.refresh(decision)
    return decision


def archive_decision(db: Session, decision_id: int, current_user: User) -> Decision:
    """Archives a decision, putting it into read-only archived state."""
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision #{decision_id} not found.")

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin_or_mgr = user_role in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value)

    if not (is_owner or is_admin_or_mgr):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to archive this decision.")

    if decision.status == DecisionStatusEnum.ARCHIVED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Decision is already archived.")

    prev_status = decision.status
    decision.status = DecisionStatusEnum.ARCHIVED.value

    create_version_snapshot(
        db=db,
        decision=decision,
        changed_by=current_user.id,
        change_summary=f"Decision archived from '{prev_status}'",
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.DECISION_ARCHIVED.value,
        entity_type="Decision",
        entity_id=decision.id,
        description=f"User '{current_user.full_name}' archived decision '{decision.title}'.",
        details={"previous_status": prev_status}
    )

    db.commit()
    db.refresh(decision)
    return decision


def unarchive_decision(db: Session, decision_id: int, current_user: User) -> Decision:
    """Restores an archived decision back to Draft status."""
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision #{decision_id} not found.")

    user_role = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin_or_mgr = user_role in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value)

    if not (is_owner or is_admin_or_mgr):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to unarchive this decision.")

    if decision.status != DecisionStatusEnum.ARCHIVED.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only archived decisions can be unarchived.")

    decision.status = DecisionStatusEnum.DRAFT.value

    create_version_snapshot(
        db=db,
        decision=decision,
        changed_by=current_user.id,
        change_summary="Decision restored from archive to Draft",
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.DECISION_UNARCHIVED.value,
        entity_type="Decision",
        entity_id=decision.id,
        description=f"User '{current_user.full_name}' unarchived decision '{decision.title}' to Draft.",
        details={"restored_to": "Draft"}
    )

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
    create_version_snapshot(
        db=db,
        decision=decision,
        changed_by=current_user.id,
        change_summary="Decision submitted for review",
    )

    from app.services.notification_service import notify_decision_submitted
    notify_decision_submitted(db=db, decision=decision, actor=current_user)

    create_audit_log(
        db=db,
        action=AuditActionEnum.DECISION_SUBMITTED,
        entity_type="Decision",
        entity_id=decision.id,
        user_id=current_user.id,
        description=f"Submitted decision \"{decision.title}\" for review",
        details={
            "decision_id": decision.id,
            "title": decision.title,
            "submitted_by": current_user.id,
        },
        skip_commit=True,
    )

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

    if not is_admin and decision.status != DecisionStatusEnum.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete a decision that has already been submitted (Status: '{decision.status}')."
        )

    decision_title = decision.title
    decision_owner_id = decision.created_by

    create_audit_log(
        db=db,
        action=AuditActionEnum.DECISION_DELETED,
        entity_type="Decision",
        entity_id=decision_id,
        user_id=current_user.id,
        description=f"Deleted decision \"{decision_title}\"",
        details={
            "decision_id": decision_id,
            "title": decision_title,
            "deleted_by": current_user.id,
            "original_creator": decision_owner_id,
        },
        skip_commit=True,
    )

    db.delete(decision)
    db.commit()

    try:
        import os
        import shutil
        from app.core.config import settings
        decision_storage_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR, "decisions", str(decision_id))
        if os.path.isdir(decision_storage_dir):
            shutil.rmtree(decision_storage_dir, ignore_errors=True)
    except Exception:
        pass
