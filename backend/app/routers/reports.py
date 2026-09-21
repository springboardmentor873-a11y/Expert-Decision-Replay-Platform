from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Decision,
    Alternative,
    Approval,
    Discussion,
    DecisionFile,
    AuditLog,
    User
)
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/summary")
def get_report_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_decisions = db.query(Decision).count()

    draft_decisions = (
        db.query(Decision)
        .filter(Decision.status == "Draft")
        .count()
    )

    approved_decisions = (
        db.query(Decision)
        .filter(Decision.status == "Approved")
        .count()
    )

    rejected_decisions = (
        db.query(Decision)
        .filter(Decision.status == "Rejected")
        .count()
    )

    total_approvals = db.query(Approval).count()

    pending_approvals = (
        db.query(Approval)
        .filter(Approval.status == "Pending")
        .count()
    )

    approved_approvals = (
        db.query(Approval)
        .filter(Approval.status == "Approved")
        .count()
    )

    rejected_approvals = (
        db.query(Approval)
        .filter(Approval.status == "Rejected")
        .count()
    )

    total_alternatives = db.query(Alternative).count()

    total_files = db.query(DecisionFile).count()

    total_discussions = db.query(Discussion).count()

    total_audit_logs = db.query(AuditLog).count()

    return {
        "decisions": {
            "total": total_decisions,
            "draft": draft_decisions,
            "approved": approved_decisions,
            "rejected": rejected_decisions
        },
        "approvals": {
            "total": total_approvals,
            "pending": pending_approvals,
            "approved": approved_approvals,
            "rejected": rejected_approvals
        },
        "total_alternatives": total_alternatives,
        "total_files": total_files,
        "total_discussions": total_discussions,
        "total_audit_logs": total_audit_logs
    }