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
from app.services.notification_service import notify


router = APIRouter(
    prefix="/decisions",
    tags=["Discussion Threads"]
)


class DiscussionThreadCreate(BaseModel):
    title: str
    content: str
    mentioned_user_ids: list[int] = []


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

    if decision.created_by != current_user.id:
        notify(
            db=db,
            user_id=decision.created_by,
            notification_type="DISCUSSION_STARTED",
            title="New discussion on your decision",
            message=f"{current_user.full_name} started '{thread.title}' on '{decision.title}'",
            entity_type="Decision",
            entity_id=decision.id,
        )

    for uid in thread_data.mentioned_user_ids:
        if uid == current_user.id:
            continue
        # Verify access
        target_user = db.query(User).filter(User.id == uid).first()
        if not target_user:
            continue
        try:
            assert_can_access_decision(target_user, decision, db)
        except Exception:
            continue
            
        notify(
            db=db,
            user_id=uid,
            notification_type="MENTIONED",
            title="You were mentioned",
            message=f"{current_user.full_name} mentioned you in discussion '{thread.title}'",
            entity_type="Decision",
            entity_id=decision.id,
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
