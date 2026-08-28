from datetime import datetime, UTC
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.decision import Decision, Stakeholder
from app.models.identity import User
from app.models.taxonomy import DecisionTagLink
from app.schemas.decision import DecisionOut
from app.services.decision_service import build_decision_out

router = APIRouter(prefix="/repository", tags=["knowledge repository"])


@router.get("", response_model=list[DecisionOut])
def search_repository(
    search: str | None = None,
    category_id: UUID | None = None,
    status: str | None = None,
    tag_id: UUID | None = None,
    stakeholder_user_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str = "newest",  # "newest", "oldest", "title"
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DecisionOut]:
    """Knowledge repository faceted search across all organizational decisions."""
    query = select(Decision).where(Decision.deleted_at.is_(None))

    if category_id:
        query = query.where(Decision.category_id == category_id)

    if status:
        query = query.where(Decision.status == status)

    if tag_id:
        query = query.join(DecisionTagLink, DecisionTagLink.decision_id == Decision.id).where(
            DecisionTagLink.tag_id == tag_id
        )

    if stakeholder_user_id:
        query = query.join(Stakeholder, Stakeholder.decision_id == Decision.id).where(
            Stakeholder.user_id == stakeholder_user_id,
            Stakeholder.deleted_at.is_(None),
        )

    if date_from:
        query = query.where(Decision.created_at >= date_from)
    if date_to:
        query = query.where(Decision.created_at <= date_to)

    if search:
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                Decision.title.ilike(s),
                Decision.problem_statement.ilike(s),
                Decision.outcome_summary.ilike(s),
            )
        )

    if sort_by == "oldest":
        query = query.order_by(Decision.created_at.asc())
    elif sort_by == "title":
        query = query.order_by(Decision.title.asc())
    else:  # newest
        query = query.order_by(Decision.created_at.desc())

    decisions = db.scalars(query.offset(skip).limit(limit)).all()
    return [build_decision_out(db, d) for d in decisions]
