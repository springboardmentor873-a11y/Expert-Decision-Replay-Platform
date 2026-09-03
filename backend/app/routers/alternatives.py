import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.alternative import DecisionAlternative
from app.models.user import User
from app.schemas.alternative import AlternativeCreate, AlternativeOut, AlternativeUpdate
from app.services.decision_service import ensure_can_edit, get_decision_or_404

router = APIRouter(prefix="/api/v1/decisions/{decision_id}/alternatives", tags=["alternatives"])


async def _get_alternative_or_404(
    db: AsyncSession, decision_id: uuid.UUID, alternative_id: uuid.UUID
) -> DecisionAlternative:
    result = await db.execute(
        select(DecisionAlternative).where(
            DecisionAlternative.id == alternative_id, DecisionAlternative.decision_id == decision_id
        )
    )
    alternative = result.scalar_one_or_none()
    if alternative is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alternative not found.")
    return alternative


@router.post("", response_model=AlternativeOut, status_code=status.HTTP_201_CREATED)
async def add_alternative(
    decision_id: uuid.UUID,
    payload: AlternativeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    ensure_can_edit(current_user, decision)

    alternative = DecisionAlternative(decision_id=decision_id, **payload.model_dump())
    db.add(alternative)
    await db.commit()
    await db.refresh(alternative)
    return alternative


@router.patch("/{alternative_id}", response_model=AlternativeOut)
async def update_alternative(
    decision_id: uuid.UUID,
    alternative_id: uuid.UUID,
    payload: AlternativeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    ensure_can_edit(current_user, decision)

    alternative = await _get_alternative_or_404(db, decision_id, alternative_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(alternative, field, value)

    await db.commit()
    await db.refresh(alternative)
    return alternative


@router.delete("/{alternative_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alternative(
    decision_id: uuid.UUID,
    alternative_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = await get_decision_or_404(db, decision_id)
    ensure_can_edit(current_user, decision)

    alternative = await _get_alternative_or_404(db, decision_id, alternative_id)
    await db.delete(alternative)
    await db.commit()
    return None
