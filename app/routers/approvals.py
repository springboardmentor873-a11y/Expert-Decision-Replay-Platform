from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.approval import Approval
from app.models.decision import Decision
from app.models.user import User
from app.schemas.approvals.approval import (
    ApprovalCreate,
    ApprovalResponse,
    ApprovalUpdate,
)
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity


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

    if decision.status in ("Approved", "Rejected", "Archived"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Decision is already {decision.status}; cannot request a new approval",
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

    approval = Approval(
        decision_id=approval_data.decision_id,
        reviewer_id=approval_data.reviewer_id,
        approval_level=approval_data.approval_level,
        status=approval_data.status,
        assigned_at=datetime.now(timezone.utc)
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

    if approval.status in ("Approved", "Rejected"):
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

    db.commit()
    db.refresh(approval)

    return approval
