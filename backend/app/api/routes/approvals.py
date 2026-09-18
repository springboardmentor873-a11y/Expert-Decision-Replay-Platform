from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.approval import (
    ApprovalActionRequest,
    ApprovalResponse,
    PendingApprovalResponse,
    RejectActionRequest,
)
from app.services.approval_service import (
    approve_decision,
    get_approval_history,
    get_pending_approvals,
    reject_decision,
)

# Router for /approvals root prefix
router = APIRouter()

# Sub-router for decision-scoped approval routes (/decisions/{decision_id}/...)
decision_approvals_router = APIRouter()


@router.get(
    "/pending",
    response_model=List[PendingApprovalResponse],
    summary="List decisions pending review and approval",
)
def list_pending_approvals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves decisions waiting for review (Submitted or Under Review).
    Accessible only to Reviewers, Managers, and Administrators.
    """
    return get_pending_approvals(db=db, current_user=current_user, skip=skip, limit=limit)


@decision_approvals_router.post(
    "/{decision_id}/approve",
    response_model=ApprovalResponse,
    status_code=status.HTTP_200_OK,
    summary="Approve a submitted decision",
)
def approve_decision_endpoint(
    decision_id: int,
    action_in: Optional[ApprovalActionRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approves a submitted decision and transitions status to 'Approved'.
    Enforces that the approver is not the decision creator.
    Creates an immutable approval record and version snapshot.
    """
    comment = action_in.comment if action_in else None
    return approve_decision(
        db=db,
        decision_id=decision_id,
        current_user=current_user,
        comment=comment,
    )


@decision_approvals_router.post(
    "/{decision_id}/reject",
    response_model=ApprovalResponse,
    status_code=status.HTTP_200_OK,
    summary="Reject a submitted decision",
)
def reject_decision_endpoint(
    decision_id: int,
    action_in: RejectActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Rejects a submitted decision and transitions status to 'Rejected'.
    Requires a non-empty rejection reason.
    Enforces that the rejecter is not the decision creator.
    Creates an immutable approval record and version snapshot.
    """
    return reject_decision(
        db=db,
        decision_id=decision_id,
        current_user=current_user,
        reason=action_in.reason,
        comment=action_in.comment,
    )


@decision_approvals_router.get(
    "/{decision_id}/approvals",
    response_model=List[ApprovalResponse],
    summary="Get approval and rejection history for a decision",
)
def list_decision_approvals_endpoint(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves chronological approval and rejection events for a decision.
    Accessible to any user with permission to view the decision.
    """
    return get_approval_history(
        db=db,
        decision_id=decision_id,
        current_user=current_user,
    )
