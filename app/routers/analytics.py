"""
Analytics router — summary metrics scoped by role.

- Employee: their own decisions only
- Manager: decisions in their department
- Administrator: platform-wide

Endpoints:
  GET /analytics/summary
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.approval import Approval
from app.models.comment import Comment
from app.models.decision import Decision
from app.models.decision_rationale import DecisionRationale
from app.models.discussion_thread import DiscussionThread
from app.models.user import User
from app.services.authorization import visible_decision_ids_filter

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _base_decision_query(db: Session, current_user: User):
    """Returns a query scoped to decisions the current user may see."""
    q = db.query(Decision)
    return visible_decision_ids_filter(q, current_user, db)


# ------------------------------------------------------------------ #
# GET /analytics/summary                                               #
# ------------------------------------------------------------------ #
@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_q = _base_decision_query(db, current_user)
    decisions = base_q.all()
    decision_ids = [d.id for d in decisions]

    # --- Decisions by status ---
    by_status = {}
    for d in decisions:
        by_status[d.status] = by_status.get(d.status, 0) + 1

    # --- Decisions by category ---
    by_category = {}
    for d in decisions:
        by_category[d.category] = by_category.get(d.category, 0) + 1

    # --- Status over time (last 30 days, grouped by day) ---
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent = [d for d in decisions if d.created_at >= thirty_days_ago]
    status_over_time: dict = {}
    for d in recent:
        day = d.created_at.date().isoformat()
        if day not in status_over_time:
            status_over_time[day] = {}
        status_over_time[day][d.status] = status_over_time[day].get(d.status, 0) + 1

    status_over_time_list = [
        {"date": day, "counts": counts}
        for day, counts in sorted(status_over_time.items())
    ]

    # --- Average time-to-approval (for Approved decisions) ---
    approved_decisions = [d for d in decisions if d.status == "Approved"]
    avg_days: Optional[float] = None
    if approved_decisions:
        total_days = 0.0
        counted = 0
        for d in approved_decisions:
            approval = (
                db.query(Approval)
                .filter(
                    Approval.decision_id == d.id,
                    Approval.status == "Approved",
                    Approval.completed_at.isnot(None),
                )
                .first()
            )
            if approval and approval.completed_at:
                delta = approval.completed_at - d.created_at
                total_days += delta.total_seconds() / 86400
                counted += 1
        if counted:
            avg_days = round(total_days / counted, 1)

    # --- Approval rate by reviewer ---
    approval_rate_by_reviewer = []
    if decision_ids:
        reviewer_stats: dict = {}
        approvals = (
            db.query(Approval)
            .filter(Approval.decision_id.in_(decision_ids))
            .all()
        )
        for ap in approvals:
            if ap.reviewer_id not in reviewer_stats:
                reviewer_stats[ap.reviewer_id] = {"approved": 0, "rejected": 0, "pending": 0}
            if ap.status == "Approved":
                reviewer_stats[ap.reviewer_id]["approved"] += 1
            elif ap.status == "Rejected":
                reviewer_stats[ap.reviewer_id]["rejected"] += 1
            else:
                reviewer_stats[ap.reviewer_id]["pending"] += 1

        for reviewer_id, stats in reviewer_stats.items():
            reviewer = db.query(User).filter(User.id == reviewer_id).first()
            total = stats["approved"] + stats["rejected"]
            rate = round(stats["approved"] / total * 100, 1) if total else 0
            approval_rate_by_reviewer.append(
                {
                    "reviewer_id": reviewer_id,
                    "reviewer_name": reviewer.full_name if reviewer else "Unknown",
                    "approved": stats["approved"],
                    "rejected": stats["rejected"],
                    "pending": stats["pending"],
                    "approval_rate_pct": rate,
                }
            )

    # --- Top contributors (most decisions created) ---
    contributor_counts: dict = {}
    for d in decisions:
        contributor_counts[d.created_by] = contributor_counts.get(d.created_by, 0) + 1

    top_contributors = []
    for user_id, count in sorted(contributor_counts.items(), key=lambda x: -x[1])[:10]:
        user = db.query(User).filter(User.id == user_id).first()
        top_contributors.append(
            {
                "user_id": user_id,
                "full_name": user.full_name if user else "Unknown",
                "decisions_created": count,
            }
        )

    return {
        "total_decisions": len(decisions),
        "by_status": by_status,
        "by_category": by_category,
        "status_over_time": status_over_time_list,
        "avg_days_to_approval": avg_days,
        "top_contributors": top_contributors,
        "approval_rate_by_reviewer": approval_rate_by_reviewer,
    }
