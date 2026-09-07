from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.decision import Decision, DecisionStatusEnum
from app.models.decision_version import DecisionVersion
from app.models.user import User

TRACKED_FIELDS = [
    "title",
    "problem_statement",
    "context",
    "decision_taken",
    "reasoning",
    "expected_outcome",
    "actual_outcome",
    "status",
]


def generate_change_summary(old_values: Dict[str, Any], new_values: Dict[str, Any]) -> str:
    """
    Generates a deterministic summary of fields changed between two snapshots.
    No AI-generated text.
    """
    # Check if this is a submission status change
    old_status = old_values.get("status")
    new_status = new_values.get("status")
    if old_status == DecisionStatusEnum.DRAFT.value and new_status == DecisionStatusEnum.SUBMITTED.value:
        return "Decision submitted for review"

    changed_fields = []
    for field in TRACKED_FIELDS:
        old_val = old_values.get(field)
        new_val = new_values.get(field)
        # Normalize empty string vs None for optional outcome fields
        if field in ("expected_outcome", "actual_outcome"):
            old_norm = old_val.strip() if isinstance(old_val, str) else None
            new_norm = new_val.strip() if isinstance(new_val, str) else None
            if old_norm != new_norm:
                changed_fields.append(field)
        else:
            if old_val != new_val:
                changed_fields.append(field)

    if not changed_fields:
        return ""

    return f"Updated: {', '.join(changed_fields)}"


def create_initial_version(db: Session, decision: Decision, user_id: int) -> DecisionVersion:
    """
    Creates Version 1 for a newly created decision.
    Transactionally added to the database session.
    """
    version = DecisionVersion(
        decision_id=decision.id,
        version_number=1,
        title=decision.title,
        problem_statement=decision.problem_statement,
        context=decision.context,
        decision_taken=decision.decision_taken,
        reasoning=decision.reasoning,
        expected_outcome=decision.expected_outcome,
        actual_outcome=decision.actual_outcome,
        status=decision.status,
        changed_by=user_id,
        change_summary="Initial decision created",
    )
    db.add(version)
    return version


def create_version_snapshot(
    db: Session,
    decision: Decision,
    changed_by: int,
    change_summary: str,
) -> DecisionVersion:
    """
    Creates a new immutable sequential version snapshot for an updated decision.
    """
    # Determine next sequential version number for this specific decision
    highest_version = (
        db.query(func.max(DecisionVersion.version_number))
        .filter(DecisionVersion.decision_id == decision.id)
        .scalar()
    )
    next_version = (highest_version or 0) + 1

    version = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        context=decision.context,
        decision_taken=decision.decision_taken,
        reasoning=decision.reasoning,
        expected_outcome=decision.expected_outcome,
        actual_outcome=decision.actual_outcome,
        status=decision.status,
        changed_by=changed_by,
        change_summary=change_summary,
    )
    db.add(version)
    return version


def get_versions(
    db: Session,
    decision_id: int,
    current_user: User,
) -> List[DecisionVersion]:
    """
    Retrieves all historical versions for a decision ordered by version_number DESC.
    Access control matches the parent decision visibility.
    """
    from app.services.decision_service import get_decision_by_id
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    return (
        db.query(DecisionVersion)
        .filter(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_number.desc())
        .all()
    )


def get_version(
    db: Session,
    decision_id: int,
    version_ref: int,
    current_user: User,
) -> DecisionVersion:
    """
    Retrieves a specific version by its version number (or primary key ID) for a decision.
    Access control matches parent decision visibility.
    """
    from app.services.decision_service import get_decision_by_id
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    # First try matching by version_number, then fallback to primary key id
    version = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision_id,
            DecisionVersion.version_number == version_ref,
        )
        .first()
    )
    if not version:
        version = (
            db.query(DecisionVersion)
            .filter(
                DecisionVersion.decision_id == decision_id,
                DecisionVersion.id == version_ref,
            )
            .first()
        )

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version '{version_ref}' not found for decision {decision_id}.",
        )

    return version


def get_latest_version(
    db: Session,
    decision_id: int,
    current_user: User,
) -> Optional[DecisionVersion]:
    """
    Retrieves the latest version for a decision.
    """
    from app.services.decision_service import get_decision_by_id
    get_decision_by_id(db=db, decision_id=decision_id, current_user=current_user)

    return (
        db.query(DecisionVersion)
        .filter(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_number.desc())
        .first()
    )


def compare_versions(
    db: Session,
    decision_id: int,
    version_a_ref: int,
    version_b_ref: int,
    current_user: User,
) -> Dict[str, Any]:
    """
    Compares two historical versions of a decision and returns the changed fields.
    Validates that both versions belong to the specified decision.
    """
    v_a = get_version(db=db, decision_id=decision_id, version_ref=version_a_ref, current_user=current_user)
    v_b = get_version(db=db, decision_id=decision_id, version_ref=version_b_ref, current_user=current_user)

    changes = []
    for field in TRACKED_FIELDS:
        val_a = getattr(v_a, field, None)
        val_b = getattr(v_b, field, None)

        if field in ("expected_outcome", "actual_outcome"):
            norm_a = val_a.strip() if isinstance(val_a, str) else None
            norm_b = val_b.strip() if isinstance(val_b, str) else None
            if norm_a != norm_b:
                changes.append({
                    "field": field,
                    "old_value": val_a,
                    "new_value": val_b,
                })
        else:
            if val_a != val_b:
                changes.append({
                    "field": field,
                    "old_value": val_a,
                    "new_value": val_b,
                })

    return {
        "decision_id": decision_id,
        "version_a": v_a.version_number,
        "version_b": v_b.version_number,
        "changes": changes,
    }
