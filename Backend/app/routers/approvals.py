from uuid import UUID as UUIDType

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.decision import Decision, DecisionStatus
from app.models.user import User
from app.schemas.approval import ApprovalOut, ApprovalCreate, DecisionApprovalStatus, ApprovalActionRequest
from app.services.approval_service import (
    get_pending_for_user,
    approve_decision,
    reject_decision,
    get_approval_history,
)
from app.services.decision_service import get_decision_or_404

router = APIRouter(prefix="/api/v1/decisions", tags=["approvals"])


@router.get("/pending-review")
async def list_pending_approvals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decisions = await get_pending_for_user(db, current_user)
    return [
        DecisionApprovalStatus(
            id=d.id,
            title=d.title,
            status=d.status,
            current_stage=(
                "reviewer"
                if d.status == DecisionStatus.UNDER_REVIEW
                else (
                    "manager"
                    if d.status == DecisionStatus.PENDING_MANAGER_REVIEW
                    else None
                )
            ),
            can_review=d.status in (DecisionStatus.UNDER_REVIEW, DecisionStatus.PENDING_MANAGER_REVIEW),
        )
        for d in decisions
    ]


@router.post("/{decision_id}/approve", response_model=DecisionApprovalStatus)
async def approve(
    decision_id: UUIDType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    decision = await approve_decision(db, decision, current_user)
    return DecisionApprovalStatus(
        id=decision.id,
        title=decision.title,
        status=decision.status,
        current_stage=(
            "manager"
            if decision.status == DecisionStatus.PENDING_MANAGER_REVIEW
            else (
                "approved"
                if decision.status == DecisionStatus.APPROVED
                else None
            )
        ),
        can_review=False,
    )


@router.post("/{decision_id}/reject", response_model=DecisionApprovalStatus)
async def reject(
    decision_id: UUIDType,
    payload: ApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    decision = await reject_decision(db, decision, current_user, payload.reason or "")
    return DecisionApprovalStatus(
        id=decision.id,
        title=decision.title,
        status=decision.status,
        current_stage=None,
        can_review=False,
    )


@router.get("/{decision_id}/approvals", response_model=list[ApprovalOut])
async def get_approvals(
    decision_id: UUIDType,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    approvals = await get_approval_history(db, decision_id)
    return approvals
