from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Approval, Decision, User, Notification, AuditLog
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalReview,
    ApprovalResponse,
)
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)


@router.post("/", response_model=ApprovalResponse)
def create_approval(
    approval_data: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decision = db.query(Decision).filter(
        Decision.id == approval_data.decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    if approval_data.reviewer_id is not None:
        reviewer = db.query(User).filter(
            User.id == approval_data.reviewer_id
        ).first()

        if not reviewer:
            raise HTTPException(
                status_code=404,
                detail="Reviewer not found"
            )

    new_approval = Approval(
        decision_id=approval_data.decision_id,
        reviewer_id=approval_data.reviewer_id,
        status="Pending"
    )

    db.add(new_approval)
    db.commit()
    db.refresh(new_approval)

    return new_approval


@router.get(
    "/decision/{decision_id}",
    response_model=list[ApprovalResponse]
)
def get_decision_approvals(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decision = db.query(Decision).filter(
        Decision.id == decision_id
    ).first()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return db.query(Approval).filter(
        Approval.decision_id == decision_id
    ).all()


@router.get(
    "/{approval_id}",
    response_model=ApprovalResponse
)
def get_approval(
    approval_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval not found"
        )

    return approval


@router.put(
    "/{approval_id}/review",
    response_model=ApprovalResponse
)
def review_approval(
    approval_id: int,
    review_data: ApprovalReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval not found"
        )

    # Only the assigned reviewer can review
    if approval.reviewer_id is not None:
        if approval.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the assigned reviewer can review this approval"
            )

    # Validate review status
    if review_data.status not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be Approved or Rejected"
        )
        # Prevent reviewing an approval that is already completed
        if approval.status != "Pending":
            raise HTTPException(
        status_code=400,
        detail=f"Approval has already been {approval.status.lower()}"
    )

    # Update approval
    approval.status = review_data.status
    approval.comments = review_data.comments
    approval.reviewed_at = datetime.utcnow()

    # Update related decision status
    decision = db.query(Decision).filter(
        Decision.id == approval.decision_id
    ).first()

    if decision:
        if review_data.status == "Approved":
            decision.status = "Approved"
        elif review_data.status == "Rejected":
            decision.status = "Rejected"

                # Create notification for the decision owner
    if decision:
        notification_message = (
            f'Decision "{decision.title}" has been '
            f'{review_data.status.lower()} by the assigned reviewer.'
        )

        notification = Notification(
            user_id=decision.owner_id,
            message=notification_message,
            notification_type="Approval"
        )

        db.add(notification)

        audit_log = AuditLog(
            user_id=current_user.id,
            action=review_data.status,
            entity_type="Approval",
            entity_id=approval.id,
            description=(
                f'Approval #{approval.id} for decision '
                f'"{decision.title}" was {review_data.status.lower()}.'
            )
        )

        db.add(audit_log)

    db.commit()
    db.refresh(approval)

    return approval


@router.delete("/{approval_id}")
def delete_approval(
    approval_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id
    ).first()

    if not approval:
        raise HTTPException(
            status_code=404,
            detail="Approval not found"
        )

    db.delete(approval)
    db.commit()

    return {
        "message": "Approval deleted successfully"
    }