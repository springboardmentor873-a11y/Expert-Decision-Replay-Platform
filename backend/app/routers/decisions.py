import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.decision import Decision
from app.models.user import User
from app.schemas.decision import DecisionCreate, DecisionDetail, DecisionOut, DecisionUpdate
from app.services.decision_service import (
    ensure_can_edit,
    get_decision_or_404,
    record_version,
    submit_for_review,
)

router = APIRouter(prefix="/api/v1/decisions", tags=["decisions"])


@router.post("", response_model=DecisionOut, status_code=status.HTTP_201_CREATED)
async def create_decision(
    payload: DecisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = Decision(
        title=payload.title,
        problem_statement=payload.problem_statement,
        category=payload.category,
        created_by=current_user.id,
        team_id=current_user.team_id,
    )
    db.add(decision)
    await db.flush()  # so decision.id exists before the version snapshot references it

    await record_version(db, decision, edited_by=current_user.id)

    await db.commit()
    await db.refresh(decision)
    return decision


@router.get("", response_model=list[DecisionOut])
async def list_decisions(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Milestone 2: every logged-in user can see every decision. Narrowing
    # this to "my team only" or "my own drafts only" is a permissions
    # decision worth making deliberately later, not bolted on here.
    result = await db.execute(select(Decision).order_by(Decision.created_at.desc()))
    return result.scalars().all()


@router.get("/{decision_id}", response_model=DecisionDetail)
async def get_decision(
    decision_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await get_decision_or_404(db, decision_id, with_children=True)


@router.patch("/{decision_id}", response_model=DecisionOut)
async def update_decision(
    decision_id: uuid.UUID,
    payload: DecisionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    ensure_can_edit(current_user, decision)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(decision, field, value)

    if updates:
        await record_version(db, decision, edited_by=current_user.id)

    await db.commit()
    await db.refresh(decision)
    return decision


@router.post("/{decision_id}/submit", response_model=DecisionOut)
async def submit_decision_for_review(
    decision_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    return await submit_for_review(db, decision, current_user)
