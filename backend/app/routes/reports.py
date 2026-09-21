from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy import func
from sqlalchemy import not_
from sqlalchemy import or_

from datetime import datetime

from typing import Optional

from app.database import get_db
from app.models import Decision
from app.models import DecisionApproval
from app.models import AuditLog
from app.models import User
from app.models import Team
from app.auth import get_current_user
from app.audit import audit_log_dict
from app.routes.decisions import VALID_STATUSES


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# ==========================================
# ACCESS HELPERS
# ==========================================
# Reports are scoped by role so no user can export data they are
# not allowed to see:
#   role 1 (Employee / Expert) -> own decisions and approvals
#   role 2 (Reviewer)          -> decisions of their own team
#   role 3 (Manager)           -> all decisions and approvals
#   role 4 (Administrator)     -> all decisions and approvals
# The Audit report is limited to Managers and Administrators,
# matching the permission rule of /audit-logs.

ORG_WIDE_ROLES = (3, 4)


def _require_audit_access(current_user):

    if current_user.role_id not in ORG_WIDE_ROLES:

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to view the audit report"
            )
        )


def _is_org_wide(current_user):

    return current_user.role_id in ORG_WIDE_ROLES


def _team_user_ids(db: Session, team_id: int):

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


# ==========================================
# ACTIVITY TYPE CLASSIFICATION
# ==========================================
# The Audit report groups every audit record into one of six
# activity types so platform activity can be summarized instead of
# presenting a raw log. Authentication records (login success /
# failure) are excluded from the default report and only shown when
# the user explicitly filters on Activity Type = Authentication,
# keeping the default view focused on decision related work.

ACTIVITY_TYPES = [
    "Decision",
    "Approval",
    "Document",
    "Discussion",
    "Authentication",
    "Other"
]

_LOGIN_ACTIONS = ("LOGIN_SUCCESS", "LOGIN_FAILED")

_APPROVAL_ACTIONS = (
    "REVIEWER_APPROVED",
    "REVIEWER_REJECTED",
    "MANAGER_APPROVED",
    "MANAGER_REJECTED"
)

_DOCUMENT_ACTIONS = ("DOCUMENT_UPLOADED", "DOCUMENT_DELETED")


def _activity_type(action, entity_type):

    act = (action or "").upper()

    ent = (entity_type or "").lower()

    if act.startswith("LOGIN") or "authentication" in ent:
        return "Authentication"

    if act in _DOCUMENT_ACTIONS or "document" in ent:
        return "Document"

    if "comment" in act or "discussion" in act or "discussion" in ent:
        return "Discussion"

    if act in _APPROVAL_ACTIONS or "assign" in act:
        return "Approval"

    if "decision" in ent or act.startswith("DECISION_"):
        return "Decision"

    return "Other"


def _activity_type_filters():
    # Priority order: Authentication > Document > Discussion >
    # Approval > Decision > Other. Exclusive filters make sure each
    # record can only ever land in one activity group even when its
    # action and entity_type would match several categories.

    auth = or_(
        AuditLog.action.in_(_LOGIN_ACTIONS),
        AuditLog.entity_type == "Authentication"
    )

    documents = or_(
        AuditLog.action.in_(_DOCUMENT_ACTIONS),
        AuditLog.entity_type == "Document"
    )

    discussion = or_(
        AuditLog.action.ilike("%COMMENT%"),
        AuditLog.action.ilike("%DISCUSSION%"),
        AuditLog.entity_type.ilike("%iscussion%")
    )

    approval = or_(
        AuditLog.action.in_(_APPROVAL_ACTIONS),
        AuditLog.action.ilike("%ASSIGNED%")
    )

    decision = or_(
        AuditLog.entity_type == "Decision",
        AuditLog.action.startswith("DECISION_")
    )

    return {
        "Authentication": auth,
        "Document": and_(documents, not_(auth)),
        "Discussion": and_(
            discussion,
            not_(auth),
            not_(documents)
        ),
        "Approval": and_(
            approval,
            not_(auth),
            not_(documents),
            not_(discussion)
        ),
        "Decision": and_(
            decision,
            not_(auth),
            not_(documents),
            not_(discussion),
            not_(approval)
        ),
        "Other": not_(or_(
            auth,
            documents,
            discussion,
            approval,
            decision
        ))
    }


# ==========================================
# DECISION SCOPE
# ==========================================
# Narrows a Decision query to the rows the current user may report
# on. Applied before any user supplied filters.

def _scope_decisions(query, db: Session, current_user):

    if _is_org_wide(current_user):
        return query

    if current_user.role_id == 2 and current_user.team_id:

        ids = _team_user_ids(db, current_user.team_id)

        return (
            query.filter(Decision.expert_id.in_(ids))
            if ids
            else query.filter(Decision.expert_id == current_user.user_id)
        )

    return query.filter(
        Decision.expert_id == current_user.user_id
    )


# ==========================================
# DECISION REPORT
# ==========================================

@router.get("/decisions")
def get_decision_report(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    team_id: Optional[int] = None,
    category_id: Optional[int] = None,
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    if status and status not in VALID_STATUSES:

        raise HTTPException(
            status_code=422,
            detail="Invalid status filter value"
        )

    query = _scope_decisions(
        db.query(Decision),
        db,
        current_user
    )

    if status:
        query = query.filter(Decision.status == status)

    if priority:
        query = query.filter(Decision.priority == priority)

    if category_id is not None:
        query = query.filter(Decision.category_id == category_id)

    if date_from is not None:
        query = query.filter(Decision.decision_date >= date_from)

    if date_to is not None:
        query = query.filter(Decision.decision_date <= date_to)

    if search and search.strip():

        term = search.strip()

        query = query.filter(
            or_(
                Decision.title.ilike(f"%{term}%"),
                Decision.description.ilike(f"%{term}%")
            )
        )

    # Team and expert filters only make sense for organization wide
    # roles. For everyone else the scope above already restricts the
    # data to their own team / own decisions.
    if _is_org_wide(current_user):

        if team_id is not None:
            query = query.filter(
                Decision.expert_id.in_(
                    _team_user_ids(db, team_id)
                )
            )

        if user_id is not None:
            query = query.filter(Decision.expert_id == user_id)

    decisions = (
        query.order_by(Decision.decision_date.desc())
        .all()
    )

    return [
        {
            "decision_id": d.decision_id,
            "title": d.title,
            "expert_id": d.expert_id,
            "expert_name": (
                d.expert.name if d.expert else None
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
            "category_id": d.category_id,
            "category_name": (
                d.category.category_name
                if d.category
                else None
            ),
            "status": d.status,
            "priority": d.priority,
            "implementation_status": d.implementation_status,
            "decision_date": d.decision_date,
            "created_at": d.created_at,
            "updated_at": d.updated_at
        }
        for d in decisions
    ]


# ==========================================
# APPROVAL REPORT
# ==========================================

@router.get("/approvals")
def get_approval_report(
    action: Optional[str] = None,
    team_id: Optional[int] = None,
    user_id: Optional[int] = None,
    decision_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    query = (
        db.query(DecisionApproval)
        .join(
            Decision,
            Decision.decision_id == DecisionApproval.decision_id
        )
    )

    query = _scope_decisions(query, db, current_user)

    if action and action.strip():
        query = query.filter(
            DecisionApproval.action == action.strip()
        )

    if decision_id is not None:
        query = query.filter(
            DecisionApproval.decision_id == decision_id
        )

    if date_from is not None:
        query = query.filter(
            DecisionApproval.created_at >= date_from
        )

    if date_to is not None:
        query = query.filter(
            DecisionApproval.created_at <= date_to
        )

    if search and search.strip():

        term = search.strip()

        query = query.filter(
            or_(
                Decision.title.ilike(f"%{term}%"),
                DecisionApproval.reason.ilike(f"%{term}%")
            )
        )

    if _is_org_wide(current_user):

        if team_id is not None:
            query = query.filter(
                Decision.expert_id.in_(
                    _team_user_ids(db, team_id)
                )
            )

        if user_id is not None:
            query = query.filter(
                DecisionApproval.user_id == user_id
            )

    approvals = (
        query.order_by(
            DecisionApproval.created_at.desc(),
            DecisionApproval.approval_id.desc()
        )
        .all()
    )

    return [
        {
            "approval_id": a.approval_id,
            "decision_id": a.decision_id,
            "decision_title": (
                a.decision.title if a.decision else None
            ),
            "action": a.action,
            "role_id": a.role_id,
            "role_name": (
                a.role.role_name if a.role else None
            ),
            "user_id": a.user_id,
            "user_name": (
                a.user.name if a.user else None
            ),
            "expert_id": (
                a.decision.expert_id
                if a.decision
                else None
            ),
            "expert_name": (
                a.decision.expert.name
                if a.decision and a.decision.expert
                else None
            ),
            "team_id": (
                a.decision.expert.team_id
                if a.decision
                and a.decision.expert
                and a.decision.expert.team_id
                else None
            ),
            "team_name": (
                a.decision.expert.team.team_name
                if a.decision
                and a.decision.expert
                and a.decision.expert.team
                else None
            ),
            "reason": a.reason,
            "created_at": a.created_at
        }
        for a in approvals
    ]


# ==========================================
# TEAM REPORT
# ==========================================
# Aggregated per-team figures derived from real decisions and
# approval records. Employees and Reviewers are limited to their
# own team; Managers and Administrators see every team.

@router.get("/teams")
def get_team_report(
    team_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    team_query = db.query(Team)

    if not _is_org_wide(current_user):

        if not current_user.team_id:
            return []

        team_query = team_query.filter(
            Team.team_id == current_user.team_id
        )

    elif team_id is not None:

        team_query = team_query.filter(
            Team.team_id == team_id
        )

    teams = team_query.order_by(Team.team_name.asc()).all()

    if not teams:
        return []

    team_ids = [t.team_id for t in teams]

    # Member counts
    member_rows = (
        db.query(User.team_id, func.count(User.user_id))
        .filter(User.team_id.in_(team_ids))
        .group_by(User.team_id)
        .all()
    )

    member_map = dict(member_rows)

    # Decision counts grouped by team and status
    decision_query = (
        db.query(
            User.team_id,
            Decision.status,
            func.count(Decision.decision_id)
        )
        .join(Decision, Decision.expert_id == User.user_id)
        .filter(User.team_id.in_(team_ids))
    )

    if date_from is not None:
        decision_query = decision_query.filter(
            Decision.decision_date >= date_from
        )

    if date_to is not None:
        decision_query = decision_query.filter(
            Decision.decision_date <= date_to
        )

    decision_rows = (
        decision_query
        .group_by(User.team_id, Decision.status)
        .all()
    )

    decisions_by_team = {}

    for t_id, status, count in decision_rows:

        breakdown = decisions_by_team.setdefault(
            t_id,
            {s: 0 for s in VALID_STATUSES}
        )

        breakdown[status] = count

    # Approval counts per team
    approval_query = (
        db.query(
            User.team_id,
            func.count(DecisionApproval.approval_id)
        )
        .join(
            Decision,
            Decision.decision_id == DecisionApproval.decision_id
        )
        .join(User, User.user_id == Decision.expert_id)
        .filter(User.team_id.in_(team_ids))
    )

    if date_from is not None:
        approval_query = approval_query.filter(
            DecisionApproval.created_at >= date_from
        )

    if date_to is not None:
        approval_query = approval_query.filter(
            DecisionApproval.created_at <= date_to
        )

    approval_rows = (
        approval_query
        .group_by(User.team_id)
        .all()
    )

    approval_map = dict(approval_rows)

    users = (
        db.query(User)
        .filter(User.team_id.in_(team_ids))
        .all()
    )

    users_by_team = {}

    for u in users:
        users_by_team.setdefault(u.team_id, []).append(u)

    report = []

    for t in teams:

        breakdown = decisions_by_team.get(
            t.team_id,
            {s: 0 for s in VALID_STATUSES}
        )

        members = users_by_team.get(t.team_id, [])

        manager_name = None

        if t.manager_user_id:
            manager = next(
                (
                    u for u in members
                    if u.user_id == t.manager_user_id
                ),
                None
            )
            if manager:
                manager_name = manager.name

        if not manager_name:

            managers = [
                u for u in members
                if u.role_id in ORG_WIDE_ROLES
            ]

            managers.sort(key=lambda u: u.user_id)

            if managers:
                manager_name = managers[0].name

        status_counts = {
            s: int(breakdown.get(s, 0) or 0)
            for s in VALID_STATUSES
        }

        report.append({
            "team_id": t.team_id,
            "team_name": t.team_name,
            "manager_name": manager_name,
            "is_archived": bool(t.is_archived),
            "member_count": int(member_map.get(t.team_id, 0) or 0),
            "decision_count": sum(status_counts.values()),
            "status_breakdown": status_counts,
            "approval_count": int(
                approval_map.get(t.team_id, 0) or 0
            )
        })

    return report


# ==========================================
# AUDIT REPORT
# ==========================================
# Restricted to Managers and Administrators, exactly like the
# Audit Logs page. Reuses the append-only audit_logs table.

@router.get("/audit")
def get_audit_report(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    decision_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    limit: Optional[int] = 1000,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    _require_audit_access(current_user)

    if activity_type and activity_type not in ACTIVITY_TYPES:

        raise HTTPException(
            status_code=422,
            detail="Invalid activity type filter value"
        )

    query = db.query(AuditLog)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    if action and action.strip():
        query = query.filter(
            AuditLog.action == action.strip()
        )

    if decision_id is not None:
        query = query.filter(
            AuditLog.decision_id == decision_id
        )

    if date_from is not None:
        query = query.filter(AuditLog.created_at >= date_from)

    if date_to is not None:
        query = query.filter(AuditLog.created_at <= date_to)

    if search and search.strip():

        term = search.strip()

        query = query.filter(
            or_(
                AuditLog.description.ilike(f"%{term}%"),
                AuditLog.action.ilike(f"%{term}%"),
                AuditLog.old_value.ilike(f"%{term}%"),
                AuditLog.new_value.ilike(f"%{term}%")
            )
        )

    # The default report focuses on decision related platform
    # activity, so login records are hidden unless the user asks for
    # Activity Type = Authentication explicitly.
    type_filters = _activity_type_filters()

    if activity_type:
        query = query.filter(type_filters[activity_type])
    else:
        query = query.filter(not_(type_filters["Authentication"]))

    logs = (
        query.order_by(
            AuditLog.created_at.desc(),
            AuditLog.log_id.desc()
        )
        .limit(min(limit or 1000, 5000))
        .all()
    )

    result = []

    for log in logs:

        entry = audit_log_dict(log)

        entry["activity_type"] = _activity_type(
            log.action,
            log.entity_type
        )

        result.append(entry)

    return result
