from collections import Counter
from typing import Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database.database import get_db
from models.audit_log import AuditLog
from models.decision import Decision, DecisionStatus
from models.team import Team
from models.user import User
from Schemas.report import DecisionReport
from security.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/decisions", response_model=DecisionReport)
def decision_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decisions = db.query(Decision).all()
    status_counts = Counter(decision.status.value for decision in decisions)
    category_counts = Counter(decision.category.value for decision in decisions)

    users: Dict[int, Dict] = {}
    teams: Dict[int, Dict] = {}
    for decision in decisions:
        user = decision.creator
        users.setdefault(decision.created_by_id, {"user_id": decision.created_by_id, "name": user.full_name, "count": 0})
        users[decision.created_by_id]["count"] += 1
        if decision.team:
            teams.setdefault(
                decision.team.id,
                {"team_id": decision.team.id, "name": decision.team.name, "count": 0},
            )
            teams[decision.team.id]["count"] += 1

    return {
        "total": len(decisions),
        "by_status": {status.value: status_counts.get(status.value, 0) for status in DecisionStatus},
        "by_category": dict(category_counts),
        "by_user": list(users.values()),
        "by_team": list(teams.values()),
        "pending_approvals": status_counts.get(DecisionStatus.under_review.value, 0),
    }


@router.get("/activity")
def recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()


@router.get("/team-activity")
def team_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.name if current_user.role else None
    teams_query = db.query(Team)
    if role_name == "administrator":
        visible_teams = teams_query.all()
    elif role_name == "manager":
        visible_teams = teams_query.filter(
            or_(Team.manager_id == current_user.id, Team.id == current_user.team_id)
        ).all()
    elif current_user.team_id is not None:
        visible_teams = teams_query.filter(Team.id == current_user.team_id).all()
    else:
        visible_teams = []

    visible_team_names = {team.id: team.name for team in visible_teams}
    visible_team_ids = list(visible_team_names)
    if not visible_team_ids:
        return []

    rows = (
        db.query(AuditLog, User.team_id, Decision.team_id)
        .join(User, AuditLog.actor_user_id == User.id)
        .outerjoin(Decision, AuditLog.decision_id == Decision.id)
        .filter(
            or_(
                User.team_id.in_(visible_team_ids),
                Decision.team_id.in_(visible_team_ids),
            )
        )
        .order_by(AuditLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": entry.id,
            "team_id": decision_team_id if decision_team_id in visible_team_names else actor_team_id,
            "team_name": visible_team_names.get(
                decision_team_id if decision_team_id in visible_team_names else actor_team_id
            ),
            "actor_user_id": entry.actor_user_id,
            "decision_id": entry.decision_id,
            "action": entry.action,
            "details": entry.details,
            "created_at": entry.created_at,
        }
        for entry, actor_team_id, decision_team_id in rows
    ]
