from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from sqlalchemy import func

from database.database import get_db
from security.auth import get_current_user
from models.decision import Decision, DecisionStatus
from models.approval_step import ApprovalStep, ApprovalStepStatus
from models.audit_log import AuditLog
from models.team import Team
from models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _role_name(user: User) -> str:
    return user.role.name if user.role else ""


def _is_step_actionable(db: Session, step: ApprovalStep) -> bool:
    """True if every earlier level for this decision has already been approved."""
    earlier_incomplete = (
        db.query(ApprovalStep)
        .filter(
            ApprovalStep.decision_id == step.decision_id,
            ApprovalStep.level < step.level,
            ApprovalStep.status != ApprovalStepStatus.approved,
        )
        .count()
    )
    return earlier_incomplete == 0


def _pending_reviews_for(db: Session, user_id: int):
    steps = (
        db.query(ApprovalStep)
        .filter(ApprovalStep.reviewer_id == user_id, ApprovalStep.status == ApprovalStepStatus.pending)
        .all()
    )
    return [
        {
            "step_id": s.id,
            "decision_id": s.decision_id,
            "decision_title": s.decision.title if s.decision else None,
            "level": s.level,
            "actionable_now": _is_step_actionable(db, s),
        }
        for s in steps
    ]


def _recent_activity_for(db: Session, user_id: int, limit: int = 10):
    entries = (
        db.query(AuditLog)
        .filter(AuditLog.actor_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "action": e.action,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "details": e.details,
            "created_at": e.created_at,
        }
        for e in entries
    ]


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = _role_name(current_user)

    if role == "administrator":
        total_users = db.query(func.count(User.id)).scalar()
        total_decisions = db.query(func.count(Decision.id)).scalar()
        total_teams = db.query(func.count(Team.id)).scalar()
        by_status = dict(
            db.query(Decision.status, func.count(Decision.id)).group_by(Decision.status).all()
        )
        recent_activity = (
            db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(15).all()
        )
        return {
            "role_view": "administrator",
            "system_analytics": {
                "total_users": total_users,
                "total_decisions": total_decisions,
                "total_teams": total_teams,
            },
            "organization_reports": {
                "decisions_by_status": {s.value: by_status.get(s, 0) for s in DecisionStatus}
            },
            "user_activity": [
                {
                    "actor_email": e.actor_email,
                    "action": e.action,
                    "details": e.details,
                    "created_at": e.created_at,
                }
                for e in recent_activity
            ],
        }

    if role == "manager":
        managed_teams = db.query(Team).filter(Team.manager_id == current_user.id).all()
        member_ids = {current_user.id}
        for team in managed_teams:
            member_ids.update(m.id for m in team.members)

        team_decisions = (
            db.query(Decision)
            .filter(Decision.created_by_id.in_(member_ids))
            .order_by(Decision.created_at.desc())
            .all()
        )
        by_status = {}
        for d in team_decisions:
            by_status[d.status.value] = by_status.get(d.status.value, 0) + 1

        return {
            "role_view": "manager",
            "team_decisions": [
                {"id": d.id, "title": d.title, "status": d.status.value, "category": d.category.value}
                for d in team_decisions
            ],
            "pending_approvals": _pending_reviews_for(db, current_user.id),
            "decision_statistics": by_status,
        }

    # employee / reviewer default view
    my_decisions = (
        db.query(Decision)
        .filter(Decision.created_by_id == current_user.id)
        .order_by(Decision.created_at.desc())
        .all()
    )
    return {
        "role_view": "employee",
        "my_decisions": [
            {"id": d.id, "title": d.title, "status": d.status.value} for d in my_decisions
        ],
        "pending_reviews": _pending_reviews_for(db, current_user.id),
        "recent_activities": _recent_activity_for(db, current_user.id),
    }
