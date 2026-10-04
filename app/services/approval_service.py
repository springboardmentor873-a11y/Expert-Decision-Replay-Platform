from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.approval import Approval
from app.models.decision import Decision
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity
from app.services.notification_service import notify

def escalate(
    db: Session,
    original_approval: Approval,
    new_reviewer_id: int,
    performed_by_user_id: int,
    reason: str = None
) -> Approval:
    new_reviewer = db.query(User).filter(User.id == new_reviewer_id).first()
    if not new_reviewer:
        raise HTTPException(status_code=404, detail="New reviewer not found")

    if new_reviewer.role not in ("Reviewer", "Manager", "Administrator"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user cannot be an approval reviewer",
        )

    if new_reviewer.id == original_approval.reviewer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Escalate to a different reviewer than the original one",
        )

    decision = db.query(Decision).filter(Decision.id == original_approval.decision_id).first()

    original_approval.status = "Escalated"
    original_approval.completed_at = datetime.now(timezone.utc)

    # due_date for the new approval should likely be new based on assignment time, 
    # but the prompt doesn't specify. We'll leave it as default logic (which is None here initially, 
    # but since it's an automated escalation maybe we don't set it and let it be null, or we can just 
    # calculate 3 days again. We'll just leave it None which is allowed).
    new_approval = Approval(
        decision_id=original_approval.decision_id,
        reviewer_id=new_reviewer.id,
        approval_level=original_approval.approval_level,
        status="Pending",
        assigned_at=datetime.now(timezone.utc),
        escalated_from_id=original_approval.id,
    )
    db.add(new_approval)
    db.flush()

    reason_text = f" ({reason})" if reason else ""
    current_user = db.query(User).filter(User.id == performed_by_user_id).first()

    log_audit(
        db=db,
        user_id=performed_by_user_id,
        action=AuditAction.ESCALATE,
        entity_type=AuditEntityType.APPROVAL,
        entity_id=original_approval.id,
        description=(
            f"{current_user.full_name} escalated approval {original_approval.id} from "
            f"reviewer {original_approval.reviewer_id} to {new_reviewer.id}{reason_text}"
        ),
        request_method="SYSTEM", # we'll use POST or SYSTEM based on caller, but we don't have request_method arg, let's just use POST
        endpoint="/approvals/escalate",
    )

    log_activity(
        db=db,
        user_id=performed_by_user_id,
        action="Approval Escalated",
        entity_type="Approval",
        entity_id=new_approval.id,
        description=(
            f"{current_user.full_name} escalated review of "
            f"'{decision.title if decision else original_approval.decision_id}' to {new_reviewer.full_name}"
        ),
    )

    notify(
        db=db,
        user_id=new_reviewer.id,
        notification_type="APPROVAL_REQUESTED",
        title="A decision needs your review (escalated)",
        message=(
            f"{current_user.full_name} escalated "
            f"'{decision.title if decision else 'a decision'}' to you for review{reason_text}"
        ),
        entity_type="Decision",
        entity_id=original_approval.decision_id,
    )

    return new_approval
