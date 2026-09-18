from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.decision import Decision, DecisionStatusEnum
from app.models.approval import Approval, ApprovalActionEnum
from app.models.audit_log import AuditLog
from app.models.discussion import Discussion
from app.models.document import Document
from app.models.notification import Notification
from app.models.role import RoleEnum
from app.models.user import User
from app.services import report_service


def get_dashboard_summary(db: Session, current_user: User) -> Dict[str, Any]:
    """
    Consolidated, role-aware summary aggregator for the Enterprise Dashboard.
    Reuses existing report_service calculations to ensure strict consistency
    between Dashboard and Reports.
    """
    role_name = current_user.role.name if current_user.role else ""
    accessible_decision_ids = report_service.get_accessible_decision_ids_query(db, current_user)

    # 1. Reuse report service for Decision Summary metrics and Decision Trend
    summary = report_service.get_decision_summary_report(db=db, current_user=current_user)

    # 2. Reuse report service for Approval metrics
    approval_rep = report_service.get_approval_report(db=db, current_user=current_user)

    # 3. Calculate reliable average turnaround time in hours from accessible approvals
    approvals_with_time = (
        db.query(Approval, Decision.created_at.label("decision_created_at"))
        .join(Decision, Approval.decision_id == Decision.id)
        .filter(Approval.decision_id.in_(accessible_decision_ids))
        .all()
    )
    average_turnaround_hours: Optional[float] = None
    if approvals_with_time:
        turnarounds = []
        for appr, dec_created_at in approvals_with_time:
            if appr.created_at and dec_created_at:
                diff = (appr.created_at - dec_created_at).total_seconds()
                if diff >= 0:
                    turnarounds.append(diff / 3600.0)
        if turnarounds:
            average_turnaround_hours = round(sum(turnarounds) / len(turnarounds), 1)

    # 4. User's own decision count
    my_decisions_count = (
        db.query(func.count(Decision.id))
        .filter(Decision.created_by == current_user.id)
        .scalar()
        or 0
    )

    # 5. Unread notifications count
    unread_notifs_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .scalar()
        or 0
    )

    # 6. Recent activity count (accessible to user)
    if role_name in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value):
        activity_count = db.query(func.count(AuditLog.id)).scalar() or 0
    else:
        activity_count = (
            db.query(func.count(AuditLog.id))
            .filter(
                or_(
                    AuditLog.user_id == current_user.id,
                    and_(
                        AuditLog.entity_type == "decision",
                        AuditLog.entity_id.in_(accessible_decision_ids),
                    ),
                )
            )
            .scalar()
            or 0
        )

    # Build KPIs
    kpis = {
        "total_decisions": summary.get("total_decisions", 0),
        "pending_review": summary.get("submitted", 0) + summary.get("under_review", 0),
        "approved": summary.get("approved", 0),
        "rejected": summary.get("rejected", 0),
        "draft": summary.get("draft", 0),
        "my_decisions": my_decisions_count,
        "recent_activity_count": activity_count,
        "unread_notifications_count": unread_notifs_count,
    }

    # Status distribution & trend directly from report summary
    status_distribution = summary.get("status_distribution", [])
    decision_trend = summary.get("decisions_over_time", [])

    # Approval summary
    approval_summary = {
        "total_reviews": approval_rep.get("total_reviews", 0),
        "approved_count": approval_rep.get("approved_count", 0),
        "rejected_count": approval_rep.get("rejected_count", 0),
        "pending_approvals": approval_rep.get("pending_approvals", 0),
        "approval_rate": approval_rep.get("approval_rate", 0.0),
        "rejection_rate": approval_rep.get("rejection_rate", 0.0),
        "average_turnaround_hours": average_turnaround_hours,
    }

    # 7. Recent Decisions (limit 10)
    recent_decision_records = (
        db.query(Decision)
        .options(joinedload(Decision.creator))
        .filter(Decision.id.in_(accessible_decision_ids))
        .order_by(Decision.updated_at.desc(), Decision.id.desc())
        .limit(10)
        .all()
    )
    recent_decisions = [
        {
            "id": d.id,
            "title": d.title,
            "status": d.status,
            "created_by": d.created_by,
            "creator_name": d.creator.full_name if d.creator else "Unknown",
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        }
        for d in recent_decision_records
    ]

    # 8. Pending Review Items (limit 10)
    # For Reviewers, Managers, Admins: decisions pending review across their visible scope
    # For Employees: their own submitted decisions awaiting review
    if role_name in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value, RoleEnum.REVIEWER.value):
        pending_query = (
            db.query(Decision)
            .options(joinedload(Decision.creator))
            .filter(
                Decision.id.in_(accessible_decision_ids),
                Decision.status.in_([
                    DecisionStatusEnum.SUBMITTED.value,
                    DecisionStatusEnum.UNDER_REVIEW.value,
                ]),
            )
            .order_by(Decision.updated_at.desc(), Decision.id.desc())
            .limit(10)
        )
    else:
        pending_query = (
            db.query(Decision)
            .options(joinedload(Decision.creator))
            .filter(
                Decision.created_by == current_user.id,
                Decision.status.in_([
                    DecisionStatusEnum.SUBMITTED.value,
                    DecisionStatusEnum.UNDER_REVIEW.value,
                ]),
            )
            .order_by(Decision.updated_at.desc(), Decision.id.desc())
            .limit(10)
        )

    pending_decision_records = pending_query.all()
    pending_items = [
        {
            "id": d.id,
            "title": d.title,
            "status": d.status,
            "submitted_by_id": d.created_by,
            "submitted_by_name": d.creator.full_name if d.creator else "Unknown",
            "submitted_at": d.updated_at,
        }
        for d in pending_decision_records
    ]

    # 9. Recent Activity from Audit Logs (limit 10)
    # Role-based visibility: Admins & Managers see broader activity; Employees & Reviewers see own or accessible decision activity
    if role_name in (RoleEnum.ADMINISTRATOR.value, RoleEnum.MANAGER.value):
        audit_records = (
            db.query(AuditLog)
            .options(joinedload(AuditLog.user))
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .limit(10)
            .all()
        )
    else:
        audit_records = (
            db.query(AuditLog)
            .options(joinedload(AuditLog.user))
            .filter(
                or_(
                    AuditLog.user_id == current_user.id,
                    and_(
                        AuditLog.entity_type == "decision",
                        AuditLog.entity_id.in_(accessible_decision_ids),
                    ),
                )
            )
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .limit(10)
            .all()
        )

    # Optional lookup of decision titles for audit entries that reference a decision
    decision_ids_in_audit = {
        a.entity_id for a in audit_records if a.entity_type == "decision" and a.entity_id
    }
    decision_titles_map = {}
    if decision_ids_in_audit:
        d_titles = (
            db.query(Decision.id, Decision.title)
            .filter(Decision.id.in_(decision_ids_in_audit))
            .all()
        )
        decision_titles_map = {d_id: d_title for d_id, d_title in d_titles}

    recent_activity = [
        {
            "id": a.id,
            "action": a.action,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "description": a.description,
            "user_id": a.user_id,
            "user_name": a.user.full_name if a.user else "System",
            "created_at": a.created_at,
            "decision_title": decision_titles_map.get(a.entity_id) if a.entity_type == "decision" else None,
        }
        for a in audit_records
    ]

    # 10. Recent Discussions (limit 5) from accessible decisions
    discussion_records = (
        db.query(Discussion)
        .options(joinedload(Discussion.user), joinedload(Discussion.decision))
        .filter(Discussion.decision_id.in_(accessible_decision_ids))
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
        .limit(5)
        .all()
    )
    recent_discussions = [
        {
            "id": disc.id,
            "decision_id": disc.decision_id,
            "decision_title": disc.decision.title if disc.decision else f"Decision #{disc.decision_id}",
            "user_id": disc.user_id,
            "user_name": disc.user.full_name if disc.user else "Unknown",
            "content_snippet": (disc.content[:120] + "...") if len(disc.content) > 120 else disc.content,
            "created_at": disc.created_at,
        }
        for disc in discussion_records
    ]

    # 11. Recent Documents (limit 5) from accessible decisions (NO server physical paths!)
    document_records = (
        db.query(Document)
        .options(joinedload(Document.uploader), joinedload(Document.decision))
        .filter(Document.decision_id.in_(accessible_decision_ids))
        .order_by(Document.created_at.desc(), Document.id.desc())
        .limit(5)
        .all()
    )
    recent_documents = [
        {
            "id": doc.id,
            "decision_id": doc.decision_id,
            "decision_title": doc.decision.title if doc.decision else f"Decision #{doc.decision_id}",
            "filename": doc.original_filename,
            "file_size": doc.file_size,
            "content_type": doc.content_type,
            "uploaded_by_id": doc.uploaded_by,
            "uploaded_by_name": doc.uploader.full_name if doc.uploader else "Unknown",
            "created_at": doc.created_at,
        }
        for doc in document_records
    ]

    # 12. Latest Notifications for current user (limit 5)
    notif_records = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(5)
        .all()
    )
    notifications = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at,
            "link": f"/decisions/{n.decision_id}" if n.decision_id else None,
        }
        for n in notif_records
    ]

    return {
        "kpis": kpis,
        "status_distribution": status_distribution,
        "decision_trend": decision_trend,
        "approval_summary": approval_summary,
        "recent_decisions": recent_decisions,
        "pending_items": pending_items,
        "recent_activity": recent_activity,
        "recent_discussions": recent_discussions,
        "recent_documents": recent_documents,
        "notifications": notifications,
        "user_role": role_name,
    }
