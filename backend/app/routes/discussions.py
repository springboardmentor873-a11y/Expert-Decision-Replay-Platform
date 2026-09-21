from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import or_

from typing import Optional

from app.database import get_db
from app.models import Decision
from app.models import DecisionComment
from app.models import User
from app.models import Team
from app.auth import get_current_user


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/discussions",
    tags=["Discussions"]
)


# ==========================================
# LIST DISCUSSIONS
# ==========================================
# A "discussion" is the comment thread attached to a
# decision. Every decision can have a discussion; this
# endpoint lists them with participant / activity info.

@router.get("/")
def get_discussions(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: Optional[int] = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    query = (
        db.query(Decision)
        .outerjoin(User, User.user_id == Decision.expert_id)
        .outerjoin(Team, Team.team_id == User.team_id)
    )

    # ==========================================
    # ACCESS SCOPING
    # ==========================================
    # Employees only see discussions they own and
    # discussions belonging to teams they belong to.
    # Managers additionally see discussions from teams
    # they manage. Administrators retain full visibility.

    if current_user.role_id != 4:

        access_filters = [
            Decision.expert_id == current_user.user_id
        ]

        if current_user.team_id is not None:

            access_filters.append(
                User.team_id == current_user.team_id
            )

        access_filters.append(
            Team.manager_user_id == current_user.user_id
        )

        query = query.filter(
            or_(*access_filters)
        )

    if search:

        query = query.filter(
            Decision.title.ilike(f"%{search.strip()}%")
        )

    if status:

        query = query.filter(
            Decision.status == status
        )

    decisions = (
        query.order_by(
            Decision.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    if not decisions:
        return []

    decision_ids = [d.decision_id for d in decisions]

    comment_rows = (
        db.query(
            DecisionComment.decision_id,
            DecisionComment.user_id,
            func.count(DecisionComment.comment_id),
            func.max(DecisionComment.created_at)
        )
        .filter(DecisionComment.decision_id.in_(decision_ids))
        .group_by(
            DecisionComment.decision_id,
            DecisionComment.user_id
        )
        .all()
    )

    per_decision = {}

    for decision_id, user_id, count, last_at in comment_rows:

        entry = per_decision.setdefault(
            decision_id,
            {
                "comment_count": 0,
                "participant_ids": set(),
                "last_activity_at": None
            }
        )

        entry["comment_count"] += count

        entry["participant_ids"].add(user_id)

        if (
            entry["last_activity_at"] is None
            or last_at > entry["last_activity_at"]
        ):
            entry["last_activity_at"] = last_at

    user_ids = set()

    for entry in per_decision.values():
        user_ids.update(entry["participant_ids"])

    users = {}

    if user_ids:

        for u in (
            db.query(User.user_id, User.name, User.email)
            .filter(User.user_id.in_(user_ids))
            .all()
        ):
            users[u.user_id] = {
                "name": u.name,
                "email": u.email
            }

    result = []

    for d in decisions:

        meta = per_decision.get(d.decision_id)

        participants = [
            {
                "user_id": uid,
                "name": users[uid]["name"],
                "email": users[uid]["email"]
            }
            for uid in sorted(
                (meta["participant_ids"] if meta else set())
            )
            if uid in users
        ]

        last_activity_at = (
            meta["last_activity_at"] if meta else d.updated_at
        )

        result.append({
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
            "team_id": (
                d.expert.team_id
                if d.expert and d.expert.team_id
                else None
            ),
            "team_name": (
                d.expert.team.team_name
                if d.expert and d.expert.team
                else None
            ),
            "comment_count": (
                meta["comment_count"] if meta else 0
            ),
            "participant_count": (
                len(meta["participant_ids"]) if meta else 0
            ),
            "participants": participants,
            "last_activity_at": last_activity_at,
            "created_at": d.created_at,
            "updated_at": d.updated_at
        })

    return result