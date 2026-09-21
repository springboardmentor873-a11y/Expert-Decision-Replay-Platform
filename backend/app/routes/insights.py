from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session
from sqlalchemy import func

from datetime import datetime, timedelta

from app.database import get_db
from app.models import Decision
from app.models import DecisionApproval
from app.models import DecisionComment
from app.models import DecisionDocument
from app.models import User
from app.models import Team
from app.auth import get_current_user


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)


VALID_STATUSES = [
    "Draft",
    "Under Review",
    "Reviewer Approved",
    "Approved",
    "Rejected",
    "Archived"
]


# ==========================================
# INSIGHTS
# ==========================================

@router.get("/")
def get_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    now = datetime.utcnow()

    # Mock future dates are stored as real datetimes normally.
    # "No upcoming activities" markers are computed below instead.

    # ------------------------------------------------
    # STATUS BREAKDOWN (all decisions)
    # ------------------------------------------------

    status_rows = (
        db.query(
            Decision.status,
            func.count(Decision.decision_id)
        )
        .group_by(Decision.status)
        .all()
    )

    status_map = dict(status_rows)

    status_breakdown = {
        s: (status_map.get(s) or 0)
        for s in VALID_STATUSES
    }

    total_decisions = sum(status_breakdown.values())

    # ------------------------------------------------
    # BY TEAM
    # ------------------------------------------------

    team_rows = (
        db.query(
            Team.team_id,
            Team.team_name,
            func.count(Decision.decision_id)
        )
        .join(User, User.team_id == Team.team_id)
        .join(Decision, Decision.expert_id == User.user_id)
        .group_by(Team.team_id, Team.team_name)
        .order_by(func.count(Decision.decision_id).desc())
        .all()
    )

    teams_breakdown = [
        {
            "team_id": t_id,
            "team_name": t_name,
            "decision_count": count
        }
        for t_id, t_name, count in team_rows
    ]

    # ------------------------------------------------
    # APPROVALS SUMMARY
    # ------------------------------------------------

    approval_rows = (
        db.query(
            DecisionApproval.action,
            func.count(DecisionApproval.approval_id)
        )
        .group_by(DecisionApproval.action)
        .all()
    )

    approval_map = dict(approval_rows)

    approval_summary = [
        {
            "action": action,
            "count": count
        }
        for action, count in approval_rows
    ]

    total_approvals = sum(approval_map.values())

    previous_approvals = (
        db.query(func.count(DecisionApproval.approval_id))
        .filter(
            DecisionApproval.created_at
            >= now - timedelta(days=30)
        )
        .scalar()
    ) or 0

    # ------------------------------------------------
    # RECENT ACTIVITY (last 8 touched decisions)
    # ------------------------------------------------

    recent_decisions = []

    for d in (
        db.query(Decision)
        .order_by(Decision.updated_at.desc())
        .limit(8)
        .all()
    ):
        recent_decisions.append({
            "decision_id": d.decision_id,
            "title": d.title,
            "status": d.status,
            "priority": d.priority,
            "expert_id": d.expert_id,
            "expert_name": (
                d.expert.name
                if d.expert
                else None
            ),
            "team_name": (
                d.expert.team.team_name
                if d.expert and d.expert.team
                else None
            ),
            "updated_at": d.updated_at,
            "created_at": d.created_at
        })

    # approval history (last 8)
    approval_history = []

    for a in (
        db.query(DecisionApproval)
        .order_by(DecisionApproval.created_at.desc())
        .limit(8)
        .all()
    ):
        approval_history.append({
            "approval_id": a.approval_id,
            "decision_id": a.decision_id,
            "decision_title": (
                a.decision.title
                if a.decision
                else None
            ),
            "action": a.action,
            "role_id": a.role_id,
            "role_name": (
                a.role.role_name
                if a.role
                else None
            ),
            "user_id": a.user_id,
            "user_name": (
                a.user.name
                if a.user
                else None
            ),
            "reason": a.reason,
            "created_at": a.created_at
        })

    # ------------------------------------------------
    # GLOBAL COUNTS
    # ------------------------------------------------

    total_teams = (
        db.query(func.count(Team.team_id)).scalar() or 0
    )
    total_users = (
        db.query(func.count(User.user_id)).scalar() or 0
    )
    total_documents = (
        db.query(func.count(DecisionDocument.document_id)).scalar() or 0
    )
    total_comments = (
        db.query(func.count(DecisionComment.comment_id)).scalar() or 0
    )

    # ------------------------------------------------
    # ROLE-SCOPED SUMMARY ("my" numbers)
    # ------------------------------------------------

    my_decisions = (
        db.query(func.count(Decision.decision_id))
        .filter(Decision.expert_id == current_user.user_id)
        .scalar()
    ) or 0

    my_approved = (
        db.query(func.count(Decision.decision_id))
        .filter(
            Decision.expert_id == current_user.user_id,
            Decision.status == "Approved"
        )
        .scalar()
    ) or 0

    my_pending = (
        db.query(func.count(Decision.decision_id))
        .filter(
            Decision.expert_id == current_user.user_id,
            Decision.status == "Under Review"
        )
        .scalar()
    ) or 0

    my_rejected = (
        db.query(func.count(Decision.decision_id))
        .filter(
            Decision.expert_id == current_user.user_id,
            Decision.status == "Rejected"
        )
        .scalar()
    ) or 0

    team_user_ids = []

    if current_user.team_id:

        team_user_ids = [
            u.user_id
            for u in (
                db.query(User.user_id)
                .filter(User.team_id == current_user.team_id)
                .all()
            )
        ]

    team_decisions = (
        db.query(func.count(Decision.decision_id))
        .filter(Decision.expert_id.in_(team_user_ids))
        .scalar()
    ) or 0

    return {
        "total_decisions": total_decisions,
        "status_breakdown": status_breakdown,
        "teams_breakdown": teams_breakdown,
        "approval_summary": approval_summary,
        "total_approvals": total_approvals,
        "previous_approvals": previous_approvals,
        "recent_decisions": recent_decisions,
        "approval_history": approval_history,
        "total_teams": total_teams,
        "total_users": total_users,
        "total_documents": total_documents,
        "total_comments": total_comments,
        "my": {
            "decisions": my_decisions,
            "approved": my_approved,
            "pending": my_pending,
            "rejected": my_rejected,
            "team_id": current_user.team_id,
            "team_decisions": team_decisions
        }
    }