from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.decision import Decision
from app.models.discussion_thread import DiscussionThread
from app.models.user import User
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision


router = APIRouter(
    prefix="/decisions",
    tags=["Discussion Threads"]
)


class DiscussionThreadCreate(BaseModel):
    title: str
    content: str


class DiscussionThreadResponse(BaseModel):
    id: int
    decision_id: int
    user_id: int
    title: str
    content: str

    class Config:
        from_attributes = True


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.post(
    "/{decision_id}/discussion-threads",
    response_model=DiscussionThreadResponse,
    status_code=status.HTTP_201_CREATED
)
def create_thread(
    decision_id: int,
    thread_data: DiscussionThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    thread = DiscussionThread(
        decision_id=decision_id,
        user_id=current_user.id,
        title=thread_data.title,
        content=thread_data.content
    )

    db.add(thread)
    db.flush()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Discussion Thread Created",
        entity_type="DiscussionThread",
        entity_id=thread.id,
        description=(
            f"{current_user.full_name} started discussion "
            f"'{thread.title}' on decision '{decision.title}'"
        )
    )

    db.commit()
    db.refresh(thread)

    return thread


@router.get(
    "/{decision_id}/discussion-threads",
    response_model=list[DiscussionThreadResponse]
)
def get_threads(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    return db.query(DiscussionThread).filter(
        DiscussionThread.decision_id == decision_id
    ).order_by(DiscussionThread.created_at.asc()).all()
