"""
Centralized, server-side authorization rules for Decision resources.

Rules (enforced regardless of what the frontend sends):
- Administrator: full access to every decision.
- Manager: access to decisions created by users in their own department.
- Reviewer: access to decisions they created themselves, OR decisions
  they have been assigned to review (an Approval record exists for them).
- Employee: access only to decisions they created themselves.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.decision import Decision
from app.models.user import User


def can_access_decision(user: User, decision: Decision, db: Session) -> bool:
    if user.role == "Administrator":
        return True

    if decision.created_by == user.id:
        return True

    if user.role == "Manager":
        creator = db.query(User).filter(User.id == decision.created_by).first()
        return bool(creator and creator.department == user.department)

    if user.role == "Reviewer":
        return (
            db.query(Approval)
            .filter(
                Approval.decision_id == decision.id,
                Approval.reviewer_id == user.id,
            )
            .first()
            is not None
        )

    return False


def assert_can_access_decision(user: User, decision: Decision, db: Session) -> None:
    if not can_access_decision(user, decision, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this decision",
        )


def visible_decision_ids_filter(query, user: User, db: Session):
    """Applies row-level scoping to a base `db.query(Decision)` query."""
    if user.role == "Administrator":
        return query

    if user.role == "Manager":
        return (
            query.join(User, Decision.created_by == User.id)
            .filter(User.department == user.department)
        )

    if user.role == "Reviewer":
        reviewed_decision_ids = [
            row[0]
            for row in db.query(Approval.decision_id)
            .filter(Approval.reviewer_id == user.id)
            .distinct()
            .all()
        ]
        return query.filter(
            (Decision.created_by == user.id)
            | (Decision.id.in_(reviewed_decision_ids))
        )

    # Employee (and any unrecognized role) — only their own decisions.
    return query.filter(Decision.created_by == user.id)
