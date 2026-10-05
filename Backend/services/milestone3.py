from typing import Optional

from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.decision import Decision
from models.notification import Notification
from models.user import User
from models.version import DecisionVersion


def add_version_snapshot(
    db: Session,
    decision: Decision,
    actor: User,
    change_summary: str,
) -> DecisionVersion:
    decision.version += 1
    snapshot = DecisionVersion(
        decision_id=decision.id,
        version=decision.version,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category.value,
        status=decision.status.value,
        rationale=decision.rationale,
        change_summary=change_summary,
        created_by_id=actor.id,
    )
    db.add(snapshot)
    return snapshot


def add_audit(
    db: Session,
    actor: User,
    action: str,
    decision: Optional[Decision] = None,
    details: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        actor_user_id=actor.id,
        decision_id=decision.id if decision else None,
        action=action,
        details=details,
    )
    db.add(entry)
    return entry


def add_notification(
    db: Session,
    recipient_user_id: int,
    message: str,
    decision: Optional[Decision] = None,
) -> Notification:
    notification = Notification(
        recipient_user_id=recipient_user_id,
        decision_id=decision.id if decision else None,
        message=message,
    )
    db.add(notification)
    return notification
