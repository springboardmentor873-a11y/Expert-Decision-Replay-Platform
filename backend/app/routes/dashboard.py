from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session
from sqlalchemy import func

from datetime import datetime, timedelta

from app.database import get_db
from app.models import Decision
from app.models import DecisionApproval
from app.models import AuditLog
from app.models import Notification
from app.models import User
from app.models import Team
from app.auth import get_current_user
from app.audit import audit_log_dict
from app.routes.notifications import notification_dict


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ==========================================
# HELPERS
# ==========================================
# The dashboard is scoped by role exactly like the reports and the
# decision workflow so a user only ever sees numbers built from data
# they are entitled to:
#   role 1 (Employee / Expert) -> their own decisions
#   role 2 (Reviewer)          -> decisions of their own team
#   role 3 (Manager)           -> decisions of their own team
#   role 4 (Administrator)     -> every decision on the platform
# Every value returned here is computed from the database (no mock
# or hardcoded numbers).

STATUS_ORDER = [
    "Draft",
    "Under Review",
    "Reviewer Approved",
    "Approved",
    "Rejected",
    "Archived"
]

ALL_STATUSES = STATUS_ORDER

APPROVAL_ACTIONS = (
    "Reviewer Approved",
    "Reviewer Rejected",
    "Manager Approved",
    "Manager Rejected"
)

ACTIVITY_DAYS = 7


def _safe_date(d):
    if d is None:
        return None
    if isinstance(d, datetime):
        return d.isoformat()
    return str(d)


def _team_user_ids(db: Session, team_id):
    if not team_id:
        return []
    return [
        row[0]
        for row in (
            db.query(User.user_id)
            .filter(User.team_id == team_id)
            .all()
        )
    ]


def _scoped_decision_query(db: Session, current_user):
    query = db.query(Decision)

    if current_user.role_id == 1:
        query = query.filter(Decision.expert_id == current_user.user_id)
    elif current_user.role_id in (2, 3):
        query = query.filter(
            Decision.expert_id.in_(
                _team_user_ids(db, current_user.team_id)
            )
        )

    return query


def _scoped_decision_ids(db: Session, current_user):
    return [
        row[0]
        for row in _scoped_decision_query(db, current_user).with_entities(
            Decision.decision_id
        ).all()
    ]


def _status_breakdown(db: Session, current_user):
    breakdown = {status: 0 for status in ALL_STATUSES}

    rows = (
        _scoped_decision_query(db, current_user)
        .with_entities(Decision.status, func.count(Decision.decision_id))
        .group_by(Decision.status)
        .all()
    )

    for status, count in rows:
        breakdown[status] = int(count)

    return breakdown


def _team_breakdown(db: Session, current_user):
    query = (
        _scoped_decision_query(db, current_user)
        .outerjoin(User, User.user_id == Decision.expert_id)
        .outerjoin(Team, Team.team_id == User.team_id)
        .with_entities(
            Team.team_id,
            Team.team_name,
            func.count(Decision.decision_id)
        )
        .group_by(Team.team_id, Team.team_name)
    )

    rows = query.all()

    return [
        {
            "team_id": team_id,
            "team_name": team_name or "No Team",
            "decision_count": int(count)
        }
        for team_id, team_name, count in rows
    ]


def _activity_buckets(rows):
    today = datetime.utcnow().date()

    buckets = []

    lookup = {}

    for offset in range(ACTIVITY_DAYS - 1, -1, -1):
        day = today - timedelta(days=offset)
        label = day.strftime("%b %d")
        lookup[day] = {
            "label": label,
            "count": 0
        }
        buckets.append(lookup[day])

    for created_at in rows:
        if created_at is None:
            continue
        day = created_at.date()
        if day in lookup:
            lookup[day]["count"] += 1

    return buckets


def _decision_activity(db: Session, current_user):
    since = datetime.utcnow() - timedelta(days=ACTIVITY_DAYS)

    rows = (
        _scoped_decision_query(db, current_user)
        .with_entities(Decision.created_at)
        .filter(Decision.created_at >= since)
        .all()
    )

    return _activity_buckets([row[0] for row in rows])


def _approval_activity(db: Session, current_user):
    since = datetime.utcnow() - timedelta(days=ACTIVITY_DAYS)

    rows = (
        _scoped_approval_query(db, current_user)
        .with_entities(DecisionApproval.created_at)
        .filter(DecisionApproval.created_at >= since)
        .all()
    )

    return _activity_buckets([row[0] for row in rows])


def _scoped_approval_query(db: Session, current_user):
    query = (
        db.query(DecisionApproval)
        .join(Decision, Decision.decision_id == DecisionApproval.decision_id)
    )

    if current_user.role_id == 1:
        query = query.filter(Decision.expert_id == current_user.user_id)
    elif current_user.role_id in (2, 3):
        query = query.filter(
            Decision.expert_id.in_(
                _team_user_ids(db, current_user.team_id)
            )
        )

    return query


def _decision_dict(decision):
    return {
        "decision_id": decision.decision_id,
        "title": decision.title,
        "status": decision.status,
        "priority": decision.priority,
        "expert_id": decision.expert_id,
        "expert_name": (
            decision.expert.name if decision.expert else None
        ),
        "team_id": (
            decision.expert.team_id if decision.expert else None
        ),
        "team_name": (
            decision.expert.team.team_name
            if decision.expert and decision.expert.team
            else None
        ),
        "updated_at": _safe_date(decision.updated_at),
        "created_at": _safe_date(decision.created_at),
        "decision_date": _safe_date(decision.decision_date)
    }


def _pending_decisions(db: Session, current_user):
    query = _scoped_decision_query(db, current_user)

    if current_user.role_id == 2:
        query = query.filter(Decision.status == "Under Review")
    elif current_user.role_id == 3:
        query = query.filter(Decision.status == "Reviewer Approved")
    elif current_user.role_id == 4:
        query = query.filter(
            Decision.status.in_(["Under Review", "Reviewer Approved"])
        )
    else:
        query = query.filter(
            Decision.status.in_(["Draft", "Under Review"])
        )

    decisions = (
        query.order_by(Decision.updated_at.desc())
        .limit(6)
        .all()
    )

    return [_decision_dict(d) for d in decisions]


def _recent_decisions(db: Session, current_user, limit=6):
    decisions = (
        _scoped_decision_query(db, current_user)
        .order_by(Decision.updated_at.desc())
        .limit(limit)
        .all()
    )

    return [_decision_dict(d) for d in decisions]


def _recent_approvals(db: Session, current_user, limit=8):
    approvals = (
        _scoped_approval_query(db, current_user)
        .order_by(DecisionApproval.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "approval_id": a.approval_id,
            "decision_id": a.decision_id,
            "decision_title": a.decision.title if a.decision else None,
            "action": a.action,
            "user_name": a.user.name if a.user else None,
            "reason": a.reason,
            "created_at": _safe_date(a.created_at)
        }
        for a in approvals
    ]


def _my_approval_counts(db: Session, current_user):
    rows = (
        db.query(DecisionApproval.action, func.count(DecisionApproval.approval_id))
        .filter(DecisionApproval.user_id == current_user.user_id)
        .group_by(DecisionApproval.action)
        .all()
    )

    counts = {action: 0 for action in APPROVAL_ACTIONS}

    for action, count in rows:
        counts[action] = int(count)

    return counts


def _recent_notifications(db: Session, current_user, limit=6):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.user_id)
        .order_by(
            Notification.is_read.asc(),
            Notification.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return [notification_dict(n) for n in notifications]


def _unread_count(db: Session, current_user):
    return (
        db.query(func.count(Notification.notification_id))
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False)
        )
        .scalar()
    ) or 0


def _recent_audit_logs(db: Session, limit=8):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc(), AuditLog.log_id.desc())
        .limit(limit)
        .all()
    )

    return [audit_log_dict(log) for log in logs]


def _metric(key, label, value, hint=None):
    return {
        "key": key,
        "label": label,
        "value": int(value or 0),
        "hint": hint
    }


# ==========================================
# GET DASHBOARD
# ==========================================

@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    role_id = current_user.role_id

    breakdown = _status_breakdown(db, current_user)

    total_decisions = sum(breakdown.values())

    approved = breakdown.get("Approved", 0)

    rejected = breakdown.get("Rejected", 0)

    under_review = breakdown.get("Under Review", 0)

    reviewer_approved = breakdown.get("Reviewer Approved", 0)

    draft = breakdown.get("Draft", 0)

    archived = breakdown.get("Archived", 0)

    pending_approvals = under_review + reviewer_approved

    my_approvals = _my_approval_counts(db, current_user)

    if role_id == 1:
        scope = "own"
        role_name = "Employee / Expert"
        metrics = [
            _metric("total_decisions", "My Decisions", total_decisions),
            _metric("my_pending", "Pending Review", under_review),
            _metric("my_approved", "Approved", approved),
            _metric("draft", "Draft", draft)
        ]
    elif role_id == 2:
        scope = "team"
        role_name = "Reviewer"

        assigned_for_review = 0
        if _team_user_ids(db, current_user.team_id):
            assigned_for_review = (
                _scoped_decision_query(db, current_user)
                .filter(
                    Decision.status == "Under Review",
                    Decision.assigned_to == current_user.user_id
                )
                .count()
            )

        metrics = [
            _metric("assigned_for_review", "Assigned for Review", assigned_for_review),
            _metric("pending_reviews", "Pending Reviews", under_review),
            _metric("approved_by_me", "Approved by Me", my_approvals.get("Reviewer Approved", 0)),
            _metric("rejected_by_me", "Rejected by Me", my_approvals.get("Reviewer Rejected", 0))
        ]
    elif role_id == 3:
        scope = "team"
        role_name = "Manager"
        metrics = [
            _metric("team_decisions", "Team Decisions", total_decisions),
            _metric("team_pending", "Pending Approvals", reviewer_approved),
            _metric("team_approved", "Approved", approved),
            _metric("team_rejected", "Rejected", rejected),
            _metric("team_under_review", "Under Review", under_review)
        ]
    elif role_id == 4:
        scope = "organization"
        role_name = "Administrator"
        total_users = db.query(func.count(User.user_id)).scalar() or 0
        total_teams = db.query(func.count(Team.team_id)).scalar() or 0
        metrics = [
            _metric("total_users", "Total Users", total_users),
            _metric("total_teams", "Total Teams", total_teams),
            _metric("total_decisions", "Total Decisions", total_decisions),
            _metric("pending_approvals", "Pending Approvals", pending_approvals),
            _metric("approved", "Approved", approved),
            _metric("rejected", "Rejected", rejected)
        ]
    else:
        scope = "own"
        role_name = "User"
        metrics = [
            _metric("total_decisions", "Decisions", total_decisions),
            _metric("draft", "Draft", draft)
        ]

    recent_decisions = _recent_decisions(db, current_user)

    recent_activity = [
        {
            "key": log.get("log_id"),
            "action": log.get("action"),
            "description": log.get("description"),
            "user_name": log.get("user_name"),
            "decision_id": log.get("decision_id"),
            "decision_title": log.get("decision_title"),
            "created_at": _safe_date(log.get("created_at"))
        }
        for log in _recent_audit_logs(db)
    ]

    return {
        "role_id": role_id,
        "role_name": role_name,
        "scope": scope,
        "metrics": metrics,

        # Legacy flat keys kept for backwards compatibility.
        "total_decisions": total_decisions,
        "approved": approved,
        "rejected": rejected,
        "pending_review": under_review,
        "draft": draft,

        "status_breakdown": breakdown,
        "team_breakdown": _team_breakdown(db, current_user),
        "decision_activity": _decision_activity(db, current_user),
        "approval_activity": _approval_activity(db, current_user),

        "recent_decisions": recent_decisions,
        "pending_decisions": _pending_decisions(db, current_user),
        "recent_approvals": _recent_approvals(db, current_user),
        "recent_activity": recent_activity,

        "notifications": _recent_notifications(db, current_user),
        "unread_notifications": _unread_count(db, current_user)
    }
