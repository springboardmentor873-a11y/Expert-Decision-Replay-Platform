import csv
import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_, desc, asc, String, cast
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.decision import Decision, DecisionStatusEnum
from app.models.approval import Approval, ApprovalActionEnum
from app.models.alternative import Alternative
from app.models.audit_log import AuditLog, AuditActionEnum
from app.models.decision_version import DecisionVersion
from app.models.discussion import Discussion
from app.models.document import Document
from app.models.role import RoleEnum
from app.models.user import User


def get_accessible_decision_ids_query(db: Session, current_user: User):
    """
    Returns an SQLAlchemy subquery selecting the IDs of decisions accessible to current_user
    according to platform RBAC:
    - Administrator: all decisions
    - Manager / Reviewer: own decisions OR non-draft decisions
    - Employee: own decisions only
    """
    role_name = current_user.role.name if current_user.role else ""
    query = db.query(Decision.id)

    if role_name == RoleEnum.ADMINISTRATOR.value:
        pass
    elif role_name in (RoleEnum.MANAGER.value, RoleEnum.REVIEWER.value):
        query = query.filter(
            or_(
                Decision.created_by == current_user.id,
                Decision.status != DecisionStatusEnum.DRAFT.value
            )
        )
    else:
        query = query.filter(Decision.created_by == current_user.id)

    return query


def apply_decision_filters(
    query,
    current_user: User,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status_filter: Optional[str] = None,
    created_by: Optional[int] = None,
    decision_id: Optional[int] = None,
    title_search: Optional[str] = None,
):
    """
    Applies RBAC visibility and optional report filters to a Decision query.
    """
    role_name = current_user.role.name if current_user.role else ""

    # RBAC visibility
    if role_name == RoleEnum.ADMINISTRATOR.value:
        pass
    elif role_name in (RoleEnum.MANAGER.value, RoleEnum.REVIEWER.value):
        query = query.filter(
            or_(
                Decision.created_by == current_user.id,
                Decision.status != DecisionStatusEnum.DRAFT.value
            )
        )
    else:
        query = query.filter(Decision.created_by == current_user.id)

    # Date range filters
    if start_date:
        query = query.filter(Decision.created_at >= start_date)
    if end_date:
        query = query.filter(Decision.created_at <= end_date)

    # Other filters
    if status_filter and status_filter.strip():
        query = query.filter(Decision.status == status_filter.strip())
    if created_by is not None:
        query = query.filter(Decision.created_by == created_by)
    if decision_id is not None:
        query = query.filter(Decision.id == decision_id)
    if title_search and title_search.strip():
        query = query.filter(Decision.title.ilike(f"%{title_search.strip()}%"))

    return query


# -------------------------------------------------------------
# A. Decision Summary Report
# -------------------------------------------------------------
def get_decision_summary_report(
    db: Session,
    current_user: User,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status_filter: Optional[str] = None,
    created_by: Optional[int] = None,
    decision_id: Optional[int] = None,
    title_search: Optional[str] = None,
) -> Dict[str, Any]:
    query = db.query(Decision.status, func.count(Decision.id))
    query = apply_decision_filters(
        query=query,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        created_by=created_by,
        decision_id=decision_id,
        title_search=title_search,
    )
    status_counts = dict(query.group_by(Decision.status).all())

    draft = status_counts.get(DecisionStatusEnum.DRAFT.value, 0)
    submitted = status_counts.get(DecisionStatusEnum.SUBMITTED.value, 0)
    under_review = status_counts.get(DecisionStatusEnum.UNDER_REVIEW.value, 0)
    approved = status_counts.get(DecisionStatusEnum.APPROVED.value, 0)
    rejected = status_counts.get(DecisionStatusEnum.REJECTED.value, 0)

    total_decisions = draft + submitted + under_review + approved + rejected

    def calc_pct(count: int) -> float:
        return round((count / total_decisions * 100), 2) if total_decisions > 0 else 0.0

    status_percentages = {
        DecisionStatusEnum.DRAFT.value: calc_pct(draft),
        DecisionStatusEnum.SUBMITTED.value: calc_pct(submitted),
        DecisionStatusEnum.UNDER_REVIEW.value: calc_pct(under_review),
        DecisionStatusEnum.APPROVED.value: calc_pct(approved),
        DecisionStatusEnum.REJECTED.value: calc_pct(rejected),
    }

    status_distribution = [
        {"status": DecisionStatusEnum.DRAFT.value, "count": draft, "percentage": status_percentages[DecisionStatusEnum.DRAFT.value], "color": "#94a3b8"},
        {"status": DecisionStatusEnum.SUBMITTED.value, "count": submitted, "percentage": status_percentages[DecisionStatusEnum.SUBMITTED.value], "color": "#3b82f6"},
        {"status": DecisionStatusEnum.UNDER_REVIEW.value, "count": under_review, "percentage": status_percentages[DecisionStatusEnum.UNDER_REVIEW.value], "color": "#f59e0b"},
        {"status": DecisionStatusEnum.APPROVED.value, "count": approved, "percentage": status_percentages[DecisionStatusEnum.APPROVED.value], "color": "#10b981"},
        {"status": DecisionStatusEnum.REJECTED.value, "count": rejected, "percentage": status_percentages[DecisionStatusEnum.REJECTED.value], "color": "#ef4444"},
    ]

    # Decisions created grouped by date for trend visual
    date_query = db.query(func.date(Decision.created_at).label("d_date"), func.count(Decision.id))
    date_query = apply_decision_filters(
        query=date_query,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        created_by=created_by,
        decision_id=decision_id,
        title_search=title_search,
    )
    trend_data = date_query.group_by("d_date").order_by("d_date").all()
    decisions_over_time = [
        {"date": str(row[0]), "count": row[1]} for row in trend_data
    ]

    return {
        "total_decisions": total_decisions,
        "draft": draft,
        "submitted": submitted,
        "under_review": under_review,
        "approved": approved,
        "rejected": rejected,
        "status_percentages": status_percentages,
        "status_distribution": status_distribution,
        "decisions_over_time": decisions_over_time,
    }


# -------------------------------------------------------------
# B. Approval Report
# -------------------------------------------------------------
def get_approval_report(
    db: Session,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    action_filter: Optional[str] = None,
    reviewer_id: Optional[int] = None,
    decision_id: Optional[int] = None,
) -> Dict[str, Any]:
    accessible_decision_ids = get_accessible_decision_ids_query(db, current_user)

    # Base query joined with Decision and Reviewer
    query = (
        db.query(Approval)
        .join(Decision, Approval.decision_id == Decision.id)
        .options(joinedload(Approval.decision), joinedload(Approval.reviewer))
        .filter(Approval.decision_id.in_(accessible_decision_ids))
    )

    if start_date:
        query = query.filter(Approval.created_at >= start_date)
    if end_date:
        query = query.filter(Approval.created_at <= end_date)
    if action_filter and action_filter.strip():
        query = query.filter(Approval.action == action_filter.strip().upper())
    if reviewer_id is not None:
        query = query.filter(Approval.reviewer_id == reviewer_id)
    if decision_id is not None:
        query = query.filter(Approval.decision_id == decision_id)

    total_reviews = query.count()

    # KPI counts across all matching approvals
    approved_count = (
        query.filter(Approval.action == ApprovalActionEnum.APPROVED.value).count()
        if not action_filter or action_filter.strip().upper() == ApprovalActionEnum.APPROVED.value
        else 0
    )
    rejected_count = (
        query.filter(Approval.action == ApprovalActionEnum.REJECTED.value).count()
        if not action_filter or action_filter.strip().upper() == ApprovalActionEnum.REJECTED.value
        else 0
    )

    if not action_filter:
        approval_rate = round((approved_count / total_reviews * 100), 2) if total_reviews > 0 else 0.0
        rejection_rate = round((rejected_count / total_reviews * 100), 2) if total_reviews > 0 else 0.0
    else:
        approval_rate = 100.0 if action_filter.upper() == ApprovalActionEnum.APPROVED.value and total_reviews > 0 else 0.0
        rejection_rate = 100.0 if action_filter.upper() == ApprovalActionEnum.REJECTED.value and total_reviews > 0 else 0.0

    # Pending decisions currently in Submitted or Under Review accessible to user
    pending_query = (
        db.query(func.count(Decision.id))
        .filter(
            Decision.id.in_(accessible_decision_ids),
            Decision.status.in_([DecisionStatusEnum.SUBMITTED.value, DecisionStatusEnum.UNDER_REVIEW.value])
        )
    )
    pending_approvals = pending_query.scalar() or 0

    # Paginated review records
    offset = (page - 1) * page_size
    records = query.order_by(Approval.created_at.desc(), Approval.id.desc()).offset(offset).limit(page_size).all()

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "decision_id": r.decision_id,
            "decision_title": r.decision.title if r.decision else f"Decision #{r.decision_id}",
            "reviewer_id": r.reviewer_id,
            "reviewer_name": r.reviewer.full_name if r.reviewer else "Unknown Reviewer",
            "reviewer_email": r.reviewer.email if r.reviewer else "",
            "action": r.action,
            "previous_status": r.previous_status,
            "new_status": r.new_status,
            "rejection_reason": r.rejection_reason,
            "comment": r.comment,
            "created_at": r.created_at,
        })

    pages = max(1, (total_reviews + page_size - 1) // page_size) if total_reviews > 0 else 1

    return {
        "total_reviews": total_reviews,
        "approved_count": approved_count,
        "rejected_count": rejected_count,
        "pending_approvals": pending_approvals,
        "approval_rate": approval_rate,
        "rejection_rate": rejection_rate,
        "reviews_by_action": [
            {"action": "Approved", "count": approved_count, "color": "#10b981"},
            {"action": "Rejected", "count": rejected_count, "color": "#ef4444"},
        ],
        "items": items,
        "total": total_reviews,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


# -------------------------------------------------------------
# C. Decision Outcome Report
# -------------------------------------------------------------
def get_outcome_report(
    db: Session,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    outcome_status: Optional[str] = None,  # "recorded" | "not_recorded"
    status_filter: Optional[str] = None,
    created_by: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    query = db.query(Decision).options(joinedload(Decision.creator))
    query = apply_decision_filters(
        query=query,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        created_by=created_by,
    )

    if outcome_status == "recorded":
        query = query.filter(Decision.actual_outcome != None, func.trim(Decision.actual_outcome) != "")
    elif outcome_status == "not_recorded":
        query = query.filter(or_(Decision.actual_outcome == None, func.trim(Decision.actual_outcome) == ""))

    total = query.count()

    # Calculate overall recorded vs not_recorded across all accessible decisions with date/creator filters
    base_calc_query = db.query(Decision)
    base_calc_query = apply_decision_filters(
        query=base_calc_query,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        created_by=created_by,
    )
    total_accessible = base_calc_query.count()
    recorded_count = base_calc_query.filter(Decision.actual_outcome != None, func.trim(Decision.actual_outcome) != "").count()
    not_recorded_count = total_accessible - recorded_count
    recorded_percentage = round((recorded_count / total_accessible * 100), 2) if total_accessible > 0 else 0.0

    offset = (page - 1) * page_size
    records = query.order_by(Decision.updated_at.desc(), Decision.id.desc()).offset(offset).limit(page_size).all()

    items = []
    for d in records:
        has_actual = bool(d.actual_outcome and d.actual_outcome.strip())
        items.append({
            "decision_id": d.id,
            "decision_title": d.title,
            "status": d.status,
            "creator_id": d.created_by,
            "creator_name": d.creator.full_name if d.creator else "Unknown",
            "expected_outcome": d.expected_outcome,
            "actual_outcome": d.actual_outcome,
            "outcome_recorded": has_actual,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        })

    pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1

    return {
        "total_decisions": total_accessible,
        "recorded_count": recorded_count,
        "not_recorded_count": not_recorded_count,
        "recorded_percentage": recorded_percentage,
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


# -------------------------------------------------------------
# D. Alternative Report
# -------------------------------------------------------------
def get_alternative_report(
    db: Session,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    decision_id: Optional[int] = None,
    is_selected: Optional[bool] = None,
    feasibility: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    accessible_decision_ids = get_accessible_decision_ids_query(db, current_user)

    query = (
        db.query(Alternative)
        .join(Decision, Alternative.decision_id == Decision.id)
        .options(joinedload(Alternative.decision))
        .filter(Alternative.decision_id.in_(accessible_decision_ids))
    )

    if decision_id is not None:
        query = query.filter(Alternative.decision_id == decision_id)
    if is_selected is not None:
        query = query.filter(Alternative.is_selected == is_selected)
    if feasibility and feasibility.strip():
        query = query.filter(Alternative.feasibility == feasibility.strip())
    if start_date:
        query = query.filter(Alternative.created_at >= start_date)
    if end_date:
        query = query.filter(Alternative.created_at <= end_date)

    total_alternatives = query.count()

    # Distinct decisions with alternatives
    decisions_count = query.with_entities(func.count(func.distinct(Alternative.decision_id))).scalar() or 0
    selected_count = query.filter(Alternative.is_selected == True).count()
    avg_per_decision = round(total_alternatives / decisions_count, 2) if decisions_count > 0 else 0.0

    # Feasibility distribution
    feas_counts = dict(
        query.filter(Alternative.feasibility != None)
        .with_entities(Alternative.feasibility, func.count(Alternative.id))
        .group_by(Alternative.feasibility)
        .all()
    )

    offset = (page - 1) * page_size
    records = query.order_by(Alternative.decision_id.asc(), Alternative.id.asc()).offset(offset).limit(page_size).all()

    items = []
    for alt in records:
        items.append({
            "alternative_id": alt.id,
            "decision_id": alt.decision_id,
            "decision_title": alt.decision.title if alt.decision else f"Decision #{alt.decision_id}",
            "decision_status": alt.decision.status if alt.decision else "",
            "name": alt.name,
            "description": alt.description,
            "pros": alt.pros,
            "cons": alt.cons,
            "cost": alt.cost,
            "feasibility": alt.feasibility,
            "risk_assessment": alt.risk_assessment,
            "is_selected": alt.is_selected,
            "created_at": alt.created_at,
        })

    pages = max(1, (total_alternatives + page_size - 1) // page_size) if total_alternatives > 0 else 1

    return {
        "total_alternatives": total_alternatives,
        "total_decisions_analyzed": decisions_count,
        "selected_alternatives_count": selected_count,
        "avg_alternatives_per_decision": avg_per_decision,
        "feasibility_distribution": feas_counts,
        "items": items,
        "total": total_alternatives,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


# -------------------------------------------------------------
# E. Decision Activity Report (Audit-based)
# -------------------------------------------------------------
def get_activity_report(
    db: Session,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    decision_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    accessible_decision_ids = get_accessible_decision_ids_query(db, current_user)
    role_name = current_user.role.name if current_user.role else ""
    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    if role_name == RoleEnum.ADMINISTRATOR.value:
        # Admin can view all activities
        if decision_id is not None:
            # Filter specifically by decision
            query = query.filter(
                or_(
                    (AuditLog.entity_type == "Decision") & (AuditLog.entity_id == decision_id),
                    cast(AuditLog.details, String).like(f'%"decision_id": {decision_id}%'),
                    cast(AuditLog.details, String).like(f'%"decision_id": "{decision_id}"%'),
                    AuditLog.description.like(f"%#{decision_id}%"),
                    AuditLog.description.like(f"%decision {decision_id}%"),
                )
            )
    else:
        # Restricted to activities related to accessible decisions
        if decision_id is not None:
            # Ensure requested decision is accessible
            dec_check = db.query(Decision.id).filter(Decision.id == decision_id, Decision.id.in_(accessible_decision_ids)).first()
            if not dec_check:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You do not have permission to view activities for this decision."
                )
            query = query.filter(
                or_(
                    (AuditLog.entity_type == "Decision") & (AuditLog.entity_id == decision_id),
                    cast(AuditLog.details, String).like(f'%"decision_id": {decision_id}%'),
                    cast(AuditLog.details, String).like(f'%"decision_id": "{decision_id}"%'),
                    AuditLog.description.like(f"%#{decision_id}%"),
                    AuditLog.description.like(f"%decision {decision_id}%"),
                )
            )
        else:
            # Decisions accessible to current_user
            query = query.filter(
                or_(
                    (AuditLog.entity_type == "Decision") & (AuditLog.entity_id.in_(accessible_decision_ids)),
                    AuditLog.user_id == current_user.id
                )
            )

    if action and action.strip():
        query = query.filter(AuditLog.action == action.strip().upper())
    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total = query.count()

    # Pre-cache decision titles for fast lookup
    offset = (page - 1) * page_size
    records = query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).offset(offset).limit(page_size).all()

    dec_id_set = set()
    for r in records:
        if r.entity_type == "Decision" and r.entity_id:
            dec_id_set.add(r.entity_id)
        elif r.details and isinstance(r.details, dict) and r.details.get("decision_id"):
            try:
                dec_id_set.add(int(r.details.get("decision_id")))
            except (ValueError, TypeError):
                pass

    dec_titles = {}
    if dec_id_set:
        rows = db.query(Decision.id, Decision.title).filter(Decision.id.in_(dec_id_set)).all()
        dec_titles = {row[0]: row[1] for row in rows}

    items = []
    for r in records:
        linked_dec_id = None
        if r.entity_type == "Decision":
            linked_dec_id = r.entity_id
        elif r.details and isinstance(r.details, dict) and r.details.get("decision_id"):
            try:
                linked_dec_id = int(r.details.get("decision_id"))
            except (ValueError, TypeError):
                pass

        items.append({
            "id": r.id,
            "timestamp": r.created_at,
            "user_id": r.user_id or 0,
            "user_name": r.user.full_name if r.user else "System",
            "user_email": r.user.email if r.user else "",
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id or 0,
            "decision_id": linked_dec_id,
            "decision_title": dec_titles.get(linked_dec_id) if linked_dec_id else None,
            "description": r.description or "",
        })

    # Action counts summary
    action_counts_raw = (
        db.query(AuditLog.action, func.count(AuditLog.id))
        .group_by(AuditLog.action)
        .limit(10)
        .all()
    )
    action_counts = {row[0]: row[1] for row in action_counts_raw}

    pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1

    return {
        "total_activities": total,
        "action_counts": action_counts,
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


# -------------------------------------------------------------
# F. Decision Timeline Report
# -------------------------------------------------------------
def get_decision_timeline(
    db: Session,
    decision_id: int,
    current_user: User,
) -> Dict[str, Any]:
    # 1. Validate decision exists and check read authorization
    decision = db.query(Decision).options(joinedload(Decision.creator)).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision with ID {decision_id} not found."
        )

    # Re-use exact authorization rules
    role_name = current_user.role.name if current_user.role else ""
    is_owner = decision.created_by == current_user.id
    is_admin = role_name == RoleEnum.ADMINISTRATOR.value
    is_reviewer_or_manager = role_name in (RoleEnum.REVIEWER.value, RoleEnum.MANAGER.value)

    if not (is_owner or is_admin or (is_reviewer_or_manager and decision.status != DecisionStatusEnum.DRAFT.value)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this decision."
        )

    events: List[Dict[str, Any]] = []

    # 1. Fetch Audit Logs for this decision
    audit_logs = (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user))
        .filter(
            or_(
                (AuditLog.entity_type == "Decision") & (AuditLog.entity_id == decision_id),
                cast(AuditLog.details, String).like(f'%"decision_id": {decision_id}%'),
                cast(AuditLog.details, String).like(f'%"decision_id": "{decision_id}"%'),
                AuditLog.description.like(f"%#{decision_id}%"),
                AuditLog.description.like(f"%decision {decision_id}%"),
            )
        )
        .order_by(AuditLog.created_at.asc(), AuditLog.id.asc())
        .all()
    )

    if audit_logs:
        for al in audit_logs:
            stage = "Activity"
            if al.action == AuditActionEnum.DECISION_CREATED.value:
                stage = "Creation"
            elif al.action == AuditActionEnum.DECISION_SUBMITTED.value:
                stage = "Submission"
            elif al.action in (AuditActionEnum.DECISION_APPROVED.value, AuditActionEnum.DECISION_REJECTED.value):
                stage = "Review"
            elif al.action.startswith("ALTERNATIVE"):
                stage = "Alternatives"
            elif al.action.startswith("DOCUMENT"):
                stage = "Documents"
            elif al.action.startswith("DISCUSSION"):
                stage = "Discussions"
            elif al.action == AuditActionEnum.DECISION_UPDATED.value:
                stage = "Revision"

            events.append({
                "event_id": f"audit-{al.id}",
                "timestamp": al.created_at,
                "stage": stage,
                "action": al.action,
                "title": al.action.replace("_", " ").title(),
                "description": al.description,
                "actor_id": al.user_id,
                "actor_name": al.user.full_name if al.user else "System",
                "actor_email": al.user.email if al.user else "",
                "metadata": al.details or {},
            })
    else:
        # Fallback to direct model records if audit logs are empty or not populated
        events.append({
            "event_id": f"dec-{decision.id}",
            "timestamp": decision.created_at,
            "stage": "Creation",
            "action": "DECISION_CREATED",
            "title": "Decision Created",
            "description": f"Decision \"{decision.title}\" was created.",
            "actor_id": decision.created_by,
            "actor_name": decision.creator.full_name if decision.creator else "Author",
            "actor_email": decision.creator.email if decision.creator else "",
            "metadata": {"status": decision.status},
        })

        # Check for Approvals
        approvals = db.query(Approval).options(joinedload(Approval.reviewer)).filter(Approval.decision_id == decision_id).order_by(Approval.created_at.asc()).all()
        for app in approvals:
            events.append({
                "event_id": f"app-{app.id}",
                "timestamp": app.created_at,
                "stage": "Review",
                "action": f"DECISION_{app.action}",
                "title": f"Decision {app.action.title()}",
                "description": app.comment or (f"Reason: {app.rejection_reason}" if app.rejection_reason else ""),
                "actor_id": app.reviewer_id,
                "actor_name": app.reviewer.full_name if app.reviewer else "Reviewer",
                "actor_email": app.reviewer.email if app.reviewer else "",
                "metadata": {"action": app.action, "rejection_reason": app.rejection_reason},
            })

    # Sort strictly chronologically
    events.sort(key=lambda x: x["timestamp"])

    return {
        "decision_id": decision.id,
        "title": decision.title,
        "status": decision.status,
        "created_at": decision.created_at,
        "updated_at": decision.updated_at,
        "creator_id": decision.created_by,
        "creator_name": decision.creator.full_name if decision.creator else "Unknown",
        "events": events,
    }


# -------------------------------------------------------------
# G. CSV Export Helper
# -------------------------------------------------------------
def export_report_to_csv(
    report_type: str,
    data: Dict[str, Any]
) -> str:
    """
    Converts report data dictionary to a clean CSV string format.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "summary":
        writer.writerow(["Report", "Decision Summary Report"])
        writer.writerow(["Generated At", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow([])
        writer.writerow(["Metric", "Count", "Percentage"])
        writer.writerow(["Total Decisions", data.get("total_decisions", 0), "100.0%"])
        for item in data.get("status_distribution", []):
            writer.writerow([item.get("status"), item.get("count"), f"{item.get('percentage')}%"])

    elif report_type == "approvals":
        writer.writerow(["Approval ID", "Decision ID", "Decision Title", "Reviewer Name", "Reviewer Email", "Action", "Previous Status", "New Status", "Rejection Reason", "Comment", "Reviewed At"])
        for item in data.get("items", []):
            writer.writerow([
                item.get("id"),
                item.get("decision_id"),
                item.get("decision_title"),
                item.get("reviewer_name"),
                item.get("reviewer_email"),
                item.get("action"),
                item.get("previous_status"),
                item.get("new_status"),
                item.get("rejection_reason") or "",
                item.get("comment") or "",
                str(item.get("created_at")),
            ])

    elif report_type == "outcomes":
        writer.writerow(["Decision ID", "Decision Title", "Status", "Creator Name", "Outcome Recorded", "Expected Outcome", "Actual Outcome", "Created At", "Updated At"])
        for item in data.get("items", []):
            writer.writerow([
                item.get("decision_id"),
                item.get("decision_title"),
                item.get("status"),
                item.get("creator_name"),
                "Yes" if item.get("outcome_recorded") else "No",
                item.get("expected_outcome") or "",
                item.get("actual_outcome") or "",
                str(item.get("created_at")),
                str(item.get("updated_at")),
            ])

    elif report_type == "alternatives":
        writer.writerow(["Alternative ID", "Decision ID", "Decision Title", "Decision Status", "Alternative Name", "Description", "Pros", "Cons", "Cost", "Feasibility", "Risk Assessment", "Selected", "Created At"])
        for item in data.get("items", []):
            writer.writerow([
                item.get("alternative_id"),
                item.get("decision_id"),
                item.get("decision_title"),
                item.get("decision_status"),
                item.get("name"),
                item.get("description"),
                item.get("pros"),
                item.get("cons"),
                item.get("cost") or "",
                item.get("feasibility") or "",
                item.get("risk_assessment") or "",
                "Yes" if item.get("is_selected") else "No",
                str(item.get("created_at")),
            ])

    elif report_type == "activity":
        writer.writerow(["Activity ID", "Timestamp", "User Name", "User Email", "Action", "Entity Type", "Entity ID", "Decision ID", "Decision Title", "Description"])
        for item in data.get("items", []):
            writer.writerow([
                item.get("id"),
                str(item.get("timestamp")),
                item.get("user_name"),
                item.get("user_email"),
                item.get("action"),
                item.get("entity_type"),
                item.get("entity_id"),
                item.get("decision_id") or "",
                item.get("decision_title") or "",
                item.get("description"),
            ])

    elif report_type == "timeline":
        writer.writerow(["Timeline Report for Decision", f"#{data.get('decision_id')} - {data.get('title')}"])
        writer.writerow(["Status", data.get("status")])
        writer.writerow(["Created At", str(data.get("created_at"))])
        writer.writerow(["Creator", data.get("creator_name")])
        writer.writerow([])
        writer.writerow(["Event ID", "Timestamp", "Stage", "Action", "Title", "Actor Name", "Description"])
        for ev in data.get("events", []):
            writer.writerow([
                ev.get("event_id"),
                str(ev.get("timestamp")),
                ev.get("stage"),
                ev.get("action"),
                ev.get("title"),
                ev.get("actor_name"),
                ev.get("description"),
            ])

    else:
        writer.writerow(["Unknown Report Type", report_type])

    return output.getvalue()


# -------------------------------------------------------------
# H. Team Report
# -------------------------------------------------------------
def get_team_report(db: Session, team_id: int, current_user: User) -> Dict[str, Any]:
    from app.models.team import Team
    from app.models.approval import Approval

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team #{team_id} not found.")

    team_decisions = db.query(Decision).filter(Decision.team_id == team_id).all()
    decision_ids = [d.id for d in team_decisions]

    status_counts = {"Draft": 0, "Submitted": 0, "Under Review": 0, "Approved": 0, "Rejected": 0, "Archived": 0}
    for d in team_decisions:
        status_counts[d.status] = status_counts.get(d.status, 0) + 1

    total_decisions = len(team_decisions)
    approved_count = status_counts.get("Approved", 0)
    approval_rate = round((approved_count / total_decisions * 100), 1) if total_decisions > 0 else 0.0

    member_contributions = []
    for m in team.members:
        u = m.user
        created_count = sum(1 for d in team_decisions if d.created_by == m.user_id)
        approvals_done = 0
        if decision_ids:
            approvals_done = db.query(Approval).filter(
                Approval.decision_id.in_(decision_ids),
                Approval.reviewer_id == m.user_id
            ).count()
        member_contributions.append({
            "user_id": m.user_id,
            "name": u.full_name if u else f"User #{m.user_id}",
            "email": u.email if u else "",
            "role": m.role,
            "decisions_created": created_count,
            "approvals_completed": approvals_done,
        })

    return {
        "team_id": team.id,
        "team_name": team.name,
        "total_decisions": total_decisions,
        "status_counts": status_counts,
        "approval_rate": approval_rate,
        "member_contributions": member_contributions,
        "created_at": datetime.now(timezone.utc),
    }


# -------------------------------------------------------------
# I. Audit Report
# -------------------------------------------------------------
def get_audit_report(
    db: Session,
    current_user: User,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
) -> Dict[str, Any]:
    query = db.query(AuditLog).options(joinedload(AuditLog.user))

    role_name = current_user.role.name if current_user.role else ""
    if role_name not in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value):
        query = query.filter(AuditLog.user_id == current_user.id)

    if action and isinstance(action, str) and action.strip():
        query = query.filter(AuditLog.action == action.strip())
    if user_id is not None and isinstance(user_id, int):
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type and isinstance(entity_type, str) and entity_type.strip():
        query = query.filter(AuditLog.entity_type == entity_type.strip())
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total = query.count()
    offset = (page - 1) * page_size
    records = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for r in records:
        items.append({
            "id": r.id,
            "timestamp": r.created_at,
            "user_id": r.user_id,
            "user_name": r.user.full_name if r.user else "System",
            "user_email": r.user.email if r.user else "",
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "description": r.description,
            "ip_address": r.ip_address,
        })

    action_counts_raw = (
        db.query(AuditLog.action, func.count(AuditLog.id))
        .group_by(AuditLog.action)
        .limit(20)
        .all()
    )
    action_counts = {row[0]: row[1] for row in action_counts_raw}
    pages = max(1, (total + page_size - 1) // page_size) if total > 0 else 1

    return {
        "total_records": total,
        "action_counts": action_counts,
        "items": items,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


def _extract_report_headers_and_rows(report_type: str, data: Dict[str, Any]):
    """Extracts tabular headers and row lists for CSV, Excel, and PDF generators."""
    clean_type = report_type.lower().strip()

    if clean_type == "summary":
        headers = ["Metric / Status", "Count", "Percentage"]
        rows = [["Total Decisions", data.get("total_decisions", 0), "100.0%"]]
        for item in data.get("status_distribution", []):
            rows.append([item.get("status"), item.get("count"), f"{item.get('percentage')}%"])
        return headers, rows

    elif clean_type == "approvals":
        headers = ["ID", "Decision", "Reviewer", "Action", "Previous", "New Status", "Comments", "Date"]
        rows = []
        for item in data.get("items", []):
            rows.append([
                item.get("id"),
                f"#{item.get('decision_id')} {item.get('decision_title') or ''}"[:35],
                item.get("reviewer_name") or "",
                item.get("action"),
                item.get("previous_status"),
                item.get("new_status"),
                (item.get("rejection_reason") or item.get("comment") or "")[:40],
                str(item.get("created_at"))[:19],
            ])
        return headers, rows

    elif clean_type == "outcomes":
        headers = ["ID", "Decision Title", "Status", "Creator", "Recorded?", "Expected", "Actual"]
        rows = []
        for item in data.get("items", []):
            rows.append([
                item.get("decision_id"),
                item.get("decision_title")[:30],
                item.get("status"),
                item.get("creator_name"),
                "Yes" if item.get("outcome_recorded") else "No",
                (item.get("expected_outcome") or "")[:35],
                (item.get("actual_outcome") or "")[:35],
            ])
        return headers, rows

    elif clean_type == "alternatives":
        headers = ["ID", "Decision", "Name", "Cost", "Feasibility", "Risk", "Selected?"]
        rows = []
        for item in data.get("items", []):
            rows.append([
                item.get("alternative_id"),
                item.get("decision_title")[:25],
                item.get("name")[:25],
                item.get("cost") or "-",
                item.get("feasibility") or "-",
                item.get("risk_assessment") or "-",
                "Yes" if item.get("is_selected") else "No",
            ])
        return headers, rows

    elif clean_type == "activity":
        headers = ["ID", "Timestamp", "User", "Action", "Entity", "Description"]
        rows = []
        for item in data.get("items", []):
            rows.append([
                item.get("id"),
                str(item.get("timestamp"))[:19],
                item.get("user_name"),
                item.get("action"),
                f"{item.get('entity_type')}:{item.get('entity_id')}",
                (item.get("description") or "")[:50],
            ])
        return headers, rows

    elif clean_type == "timeline":
        headers = ["Event ID", "Timestamp", "Stage", "Action", "Actor", "Description"]
        rows = []
        for ev in data.get("events", []):
            rows.append([
                ev.get("event_id"),
                str(ev.get("timestamp"))[:19],
                ev.get("stage"),
                ev.get("action"),
                ev.get("actor_name"),
                (ev.get("description") or "")[:50],
            ])
        return headers, rows

    elif clean_type == "team":
        headers = ["Member Name", "Email", "Team Role", "Decisions Created", "Approvals Done"]
        rows = []
        for mc in data.get("member_contributions", []):
            rows.append([
                mc.get("name"),
                mc.get("email"),
                mc.get("role"),
                mc.get("decisions_created"),
                mc.get("approvals_completed"),
            ])
        return headers, rows

    elif clean_type == "audit":
        headers = ["ID", "Timestamp", "User", "Action", "Entity", "IP Address", "Description"]
        rows = []
        for item in data.get("items", []):
            rows.append([
                item.get("id"),
                str(item.get("timestamp"))[:19],
                item.get("user_name"),
                item.get("action"),
                f"{item.get('entity_type')}:{item.get('entity_id')}",
                item.get("ip_address") or "-",
                (item.get("description") or "")[:50],
            ])
        return headers, rows

    return [], []


def export_report_to_excel(report_type: str, data: Dict[str, Any]) -> bytes:
    """Generates a professional styled Microsoft Excel spreadsheet (.xlsx)."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    clean_title = (report_type.capitalize() + " Report")[:31]
    ws.title = clean_title

    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Calibri", size=14, bold=True, color="1E3A8A")
    meta_font = Font(name="Calibri", size=9, italic=True, color="64748B")
    data_font = Font(name="Calibri", size=10)
    alt_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    ws.append([f"Expert Decision Replay Platform - {report_type.capitalize()} Report"])
    ws.cell(row=1, column=1).font = title_font
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    ws.append([f"Generated at: {now_str}"])
    ws.cell(row=2, column=1).font = meta_font
    ws.append([])

    headers, rows = _extract_report_headers_and_rows(report_type, data)
    if headers:
        ws.append(headers)
        header_row_idx = ws.max_row
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=header_row_idx, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center" if "id" in headers[col_idx-1].lower() else "left", vertical="center")
            cell.border = thin_border

        for r_idx, row_data in enumerate(rows, start=header_row_idx + 1):
            ws.append([str(c) if c is not None else "" for c in row_data])
            for col_idx in range(1, len(row_data) + 1):
                cell = ws.cell(row=r_idx, column=col_idx)
                cell.font = data_font
                cell.border = thin_border
                if r_idx % 2 == 0:
                    cell.fill = alt_fill

    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 50)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def export_report_to_pdf(report_type: str, data: Dict[str, Any]) -> bytes:
    """Generates a professional formatted PDF report document (.pdf)."""
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    use_landscape = report_type.lower() in ("approvals", "activity", "alternatives", "audit", "timeline")
    doc = SimpleDocTemplate(
        buf,
        pagesize=landscape(letter) if use_landscape else letter,
        rightMargin=28,
        leftMargin=28,
        topMargin=28,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E3A8A'),
        fontName='Helvetica-Bold'
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B'),
        fontName='Helvetica-Oblique'
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica'
    )
    header_cell_style = ParagraphStyle(
        'TableHeaderCell',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.white,
        fontName='Helvetica-Bold'
    )

    story = []
    story.append(Paragraph("Expert Decision Replay Platform", title_style))
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    story.append(Paragraph(f"{report_type.capitalize()} Report | Generated: {now_str}", meta_style))
    story.append(Spacer(1, 12))

    headers, rows = _extract_report_headers_and_rows(report_type, data)
    if headers:
        table_data = [[Paragraph(h, header_cell_style) for h in headers]]
        display_rows = rows[:100]
        for row in display_rows:
            table_data.append([Paragraph(str(c or ""), cell_style) for c in row])

        t = Table(table_data, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        story.append(t)
        if len(rows) > 100:
            story.append(Spacer(1, 8))
            story.append(Paragraph(f"Note: Showing first 100 of {len(rows)} records in PDF preview. Export Excel (.xlsx) for complete dataset.", meta_style))

    doc.build(story)
    return buf.getvalue()
