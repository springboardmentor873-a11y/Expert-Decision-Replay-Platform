from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.approval import Approval
from app.models.user import User
from app.models.decision import Decision
from app.services.notification_service import notify
from app.services.approval_service import escalate
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_fallback_reviewer(db: Session, original_reviewer: User) -> User:
    """
    Finds a fallback reviewer: Manager/Admin in same dept, else any Admin.
    """
    fallback = (
        db.query(User)
        .filter(
            User.department == original_reviewer.department,
            User.role.in_(["Manager", "Administrator"]),
            User.is_active == True,
            User.id != original_reviewer.id
        )
        .first()
    )
    if fallback:
        return fallback

    return (
        db.query(User)
        .filter(
            User.role == "Administrator",
            User.is_active == True,
            User.id != original_reviewer.id
        )
        .first()
    )


def check_overdue_approvals(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    try:
        now = datetime.now(timezone.utc)

        # 1. Reminders
        overdue_approvals = (
            db.query(Approval)
            .filter(
                Approval.status == "Pending",
                Approval.due_date <= now,
                Approval.reminder_sent_at == None
            )
            .all()
        )

        for approval in overdue_approvals:
            decision = db.query(Decision).filter(Decision.id == approval.decision_id).first()
            if decision:
                # Notify reviewer
                notify(
                    db=db,
                    user_id=approval.reviewer_id,
                    notification_type="APPROVAL_OVERDUE",
                    title="Approval Overdue",
                    message=f"The approval for '{decision.title}' is now overdue.",
                    entity_type="Decision",
                    entity_id=decision.id,
                )
                
                # Notify assigner (the creator of the decision for simplicity, unless we track assigner)
                notify(
                    db=db,
                    user_id=decision.created_by,
                    notification_type="APPROVAL_OVERDUE",
                    title="Approval Overdue",
                    message=f"The approval for '{decision.title}' assigned to user {approval.reviewer_id} is overdue.",
                    entity_type="Decision",
                    entity_id=decision.id,
                )

                approval.reminder_sent_at = now

        db.commit()

        # 2. Auto-Escalation
        grace_period_end = now - timedelta(hours=settings.sla_grace_period_hours)
        escalation_candidates = (
            db.query(Approval)
            .filter(
                Approval.status == "Pending",
                Approval.due_date <= grace_period_end
            )
            .all()
        )

        for approval in escalation_candidates:
            original_reviewer = db.query(User).filter(User.id == approval.reviewer_id).first()
            if original_reviewer:
                fallback_reviewer = get_fallback_reviewer(db, original_reviewer)
                if fallback_reviewer:
                    try:
                        escalate(
                            db=db,
                            original_approval=approval,
                            new_reviewer_id=fallback_reviewer.id,
                            # Use system (e.g. an admin) or original reviewer, but performed by should be an ID.
                            # We'll just use fallback_reviewer.id or original_reviewer.id as actor.
                            # Best would be to use fallback reviewer as the actor or just 1 if we have a known admin.
                            performed_by_user_id=fallback_reviewer.id,
                            reason="Automatic SLA-driven escalation"
                        )
                        logger.info(f"Auto-escalated approval {approval.id} to user {fallback_reviewer.id}")
                    except Exception as e:
                        logger.error(f"Failed to auto-escalate approval {approval.id}: {str(e)}")

        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Error in check_overdue_approvals: {str(e)}")
    finally:
        if close_db:
            db.close()
