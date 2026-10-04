from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.approval import Approval
from app.models.decision import Decision
from app.models.user import User
from app.schemas.approvals.approval import (
    ApprovalCreate,
    ApprovalEscalate,
    ApprovalResponse,
    ApprovalUpdate,
)
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity
from app.services.notification_service import notify
from app.services.approval_service import escalate


router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)


@router.post(
    "",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED
)
def create_approval(
    approval_data: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Manager", "Administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or Administrator access required"
        )

    decision = (
        db.query(Decision)
        .filter(Decision.id == approval_data.decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision not found"
        )

    if decision.status in ("Rejected", "Archived"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Decision is already {decision.status}; cannot request a new approval",
        )

    # A decision already "Approved" at a lower level can still receive a
    # higher-level approval request (an additional sign-off on top of an
    # existing approval) — but not a duplicate/lower one.
    if decision.status == "Approved" and approval_data.approval_level == 1:
        max_existing_level = (
            db.query(Approval)
            .filter(Approval.decision_id == approval_data.decision_id)
            .count()
        )
        if max_existing_level > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Decision is already Approved; cannot request a new level-1 approval",
            )

    reviewer = (
        db.query(User)
        .filter(User.id == approval_data.reviewer_id)
        .first()
    )

    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reviewer not found"
        )

    if reviewer.role not in ["Reviewer", "Manager", "Administrator"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected user cannot be an approval reviewer"
        )

    # Multi-level approval sequencing: level N (N > 1) can only be
    # requested once level N-1 has been Approved for this decision.
    if approval_data.approval_level > 1:
        prior_level_approved = (
            db.query(Approval)
            .filter(
                Approval.decision_id == approval_data.decision_id,
                Approval.approval_level == approval_data.approval_level - 1,
                Approval.status == "Approved",
            )
            .first()
        )
        if not prior_level_approved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Level {approval_data.approval_level - 1} approval must be "
                    f"completed before requesting level {approval_data.approval_level}"
                ),
            )

    existing_pending = (
        db.query(Approval)
        .filter(
            Approval.decision_id == approval_data.decision_id,
            Approval.approval_level == approval_data.approval_level,
            Approval.status == "Pending",
        )
        .first()
    )
    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A pending level {approval_data.approval_level} approval already exists",
        )

    due_date = approval_data.due_date
    if due_date is None:
        # Default to 3 business days
        days_added = 0
        current = datetime.now(timezone.utc)
        while days_added < 3:
            current += timedelta(days=1)
            if current.weekday() < 5:  # Monday to Friday
                days_added += 1
        due_date = current

    approval = Approval(
        decision_id=approval_data.decision_id,
        reviewer_id=approval_data.reviewer_id,
        approval_level=approval_data.approval_level,
        status=approval_data.status,
        assigned_at=datetime.now(timezone.utc),
        due_date=due_date
    )

    db.add(approval)
    db.flush()

    # Move the decision into the review pipeline.
    decision.status = "Under Review"

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.SUBMIT,
        entity_type=AuditEntityType.APPROVAL,
        entity_id=approval.id,
        description=(
            f"Approval requested from reviewer {reviewer.id} "
            f"for decision {decision.id}"
        ),
        request_method="POST",
        endpoint="/approvals",
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Approval Submitted",
        entity_type="Approval",
        entity_id=approval.id,
        description=(
            f"{current_user.full_name} submitted decision '{decision.title}' "
            f"for review by {reviewer.full_name}"
        ),
    )

    notify(
        db=db,
        user_id=reviewer.id,
        notification_type="APPROVAL_REQUESTED",
        title="A decision needs your review",
        message=f"{current_user.full_name} asked you to review '{decision.title}'",
        entity_type="Decision",
        entity_id=decision.id,
    )

    db.commit()
    db.refresh(approval)

    return approval


@router.get(
    "",
    response_model=list[ApprovalResponse]
)
def get_approvals(
    decision_id: int | None = None,
    reviewer_id: int | None = None,
    approval_status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Approval)

    if current_user.role == "Employee":
        query = (
            query
            .join(Decision, Approval.decision_id == Decision.id)
            .filter(Decision.created_by == current_user.id)
        )

    elif current_user.role == "Reviewer":
        query = query.filter(
            Approval.reviewer_id == current_user.id
        )

    elif current_user.role not in ["Manager", "Administrator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    if decision_id is not None:
        query = query.filter(
            Approval.decision_id == decision_id
        )

    if reviewer_id is not None:
        query = query.filter(
            Approval.reviewer_id == reviewer_id
        )

    if approval_status:
        query = query.filter(
            Approval.status == approval_status
        )

    return (
        query
        .order_by(Approval.assigned_at.desc())
        .all()
    )


@router.get(
    "/{approval_id}",
    response_model=ApprovalResponse
)
def get_approval(
    approval_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approval = (
        db.query(Approval)
        .filter(Approval.id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )

    if current_user.role == "Reviewer":
        if approval.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    elif current_user.role == "Employee":
        decision = (
            db.query(Decision)
            .filter(Decision.id == approval.decision_id)
            .first()
        )

        if not decision or decision.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    elif current_user.role not in [
        "Manager",
        "Administrator"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    return approval


@router.patch(
    "/{approval_id}",
    response_model=ApprovalResponse
)
def update_approval(
    approval_id: int,
    approval_data: ApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approval = (
        db.query(Approval)
        .filter(Approval.id == approval_id)
        .first()
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found"
        )

    if current_user.role == "Reviewer":
        if approval.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned reviewer can update this approval"
            )

    elif current_user.role not in [
        "Manager",
        "Administrator"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager, Reviewer or Administrator access required"
        )

    if approval.status in ("Approved", "Rejected", "Escalated"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This approval has already been {approval.status.lower()}",
        )

    old_status = approval.status

    if approval_data.status is not None:
        if approval_data.status not in ("Pending", "Approved", "Rejected"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="status must be one of: Pending, Approved, Rejected",
            )

        approval.status = approval_data.status

        if approval_data.status in ["Approved", "Rejected"]:
            approval.completed_at = (
                approval_data.completed_at
                or datetime.now(timezone.utc)
            )
        elif approval_data.completed_at is not None:
            approval.completed_at = approval_data.completed_at

    elif approval_data.completed_at is not None:
        approval.completed_at = approval_data.completed_at

    decision = db.query(Decision).filter(Decision.id == approval.decision_id).first()

    if decision and approval.status in ("Approved", "Rejected") and old_status != approval.status:
        decision.status = approval.status

        log_audit(
            db=db,
            user_id=current_user.id,
            action=(
                AuditAction.APPROVE
                if approval.status == "Approved"
                else AuditAction.REJECT
            ),
            entity_type=AuditEntityType.APPROVAL,
            entity_id=approval.id,
            description=(
                f"{current_user.full_name} {approval.status.lower()} "
                f"decision '{decision.title}'"
            ),
            old_value={"status": old_status},
            new_value={"status": approval.status},
            request_method="PATCH",
            endpoint=f"/approvals/{approval.id}",
        )

        log_activity(
            db=db,
            user_id=current_user.id,
            action=f"Decision {approval.status}",
            entity_type="Decision",
            entity_id=decision.id,
            description=(
                f"{current_user.full_name} {approval.status.lower()} "
                f"decision '{decision.title}'"
            ),
        )

        if decision.created_by != current_user.id:
            notify(
                db=db,
                user_id=decision.created_by,
                notification_type=(
                    "DECISION_APPROVED" if approval.status == "Approved" else "DECISION_REJECTED"
                ),
                title=f"Your decision was {approval.status.lower()}",
                message=(
                    f"{current_user.full_name} {approval.status.lower()} "
                    f"'{decision.title}'"
                ),
                entity_type="Decision",
                entity_id=decision.id,
            )

    db.commit()
    db.refresh(approval)

    return approval


@router.post(
    "/{approval_id}/escalate",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def escalate_approval(
    approval_id: int,
    payload: ApprovalEscalate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reassigns a still-pending approval to a different reviewer — e.g. the
    original reviewer is unavailable. The original approval is marked
    'Escalated' (a terminal, non-actionable state) and a brand new
    Pending approval is created at the same level for the new reviewer.
    Only a Manager or an Administrator can escalate.
    """
    if current_user.role not in ("Manager", "Administrator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or Administrator access required",
        )

    original = db.query(Approval).filter(Approval.id == approval_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Approval not found")

    if original.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only a Pending approval can be escalated (this one is {original.status})",
        )

    new_approval = escalate(
        db=db,
        original_approval=original,
        new_reviewer_id=payload.new_reviewer_id,
        performed_by_user_id=current_user.id,
        reason=payload.reason
    )

    db.commit()
    db.refresh(new_approval)

    return new_approval
