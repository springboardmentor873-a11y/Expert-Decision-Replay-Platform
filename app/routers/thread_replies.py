from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.decision import Decision
from app.models.discussion_thread import DiscussionThread
from app.models.thread_reply import ThreadReply
from app.models.user import User
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision
from app.services.notification_service import notify


router = APIRouter(
    prefix="/discussion-threads",
    tags=["Thread Replies"]
)


class ThreadReplyCreate(BaseModel):
    content: str
    mentioned_user_ids: list[int] = []


class ThreadReplyResponse(BaseModel):
    id: int
    thread_id: int
    user_id: int
    content: str

    class Config:
        from_attributes = True


def _get_thread_and_decision(db: Session, thread_id: int):
    thread = db.query(DiscussionThread).filter(
        DiscussionThread.id == thread_id
    ).first()

    if not thread:
        raise HTTPException(status_code=404, detail="Discussion thread not found")

    decision = db.query(Decision).filter(Decision.id == thread.decision_id).first()
    return thread, decision


@router.post(
    "/{thread_id}/replies",
    response_model=ThreadReplyResponse,
    status_code=status.HTTP_201_CREATED
)
def create_reply(
    thread_id: int,
    reply_data: ThreadReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    thread, decision = _get_thread_and_decision(db, thread_id)
    assert_can_access_decision(current_user, decision, db)

    reply = ThreadReply(
        thread_id=thread_id,
        user_id=current_user.id,
        content=reply_data.content
    )

    db.add(reply)
    db.flush()

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Thread Reply Added",
        entity_type="ThreadReply",
        entity_id=reply.id,
        description=f"{current_user.full_name} replied in thread '{thread.title}'"
    )

    for uid in reply_data.mentioned_user_ids:
        if uid == current_user.id:
            continue
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
            message=f"{current_user.full_name} mentioned you in a reply in '{thread.title}'",
            entity_type="Decision",
            entity_id=decision.id,
        )

    db.commit()
    db.refresh(reply)

    return reply


@router.get(
    "/{thread_id}/replies",
    response_model=list[ThreadReplyResponse]
)
def get_replies(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    thread, decision = _get_thread_and_decision(db, thread_id)
    assert_can_access_decision(current_user, decision, db)

    return db.query(ThreadReply).filter(
        ThreadReply.thread_id == thread_id
    ).order_by(ThreadReply.created_at.asc()).all()
