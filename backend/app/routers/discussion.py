from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Discussion, Decision, User
from app.schemas.discussion import DiscussionCreate, DiscussionResponse
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/decisions",
    tags=["Discussions"]
)


@router.post(
    "/{decision_id}/discussions/",
    response_model=DiscussionResponse
)
def create_discussion(
    decision_id: int,
    discussion: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    new_discussion = Discussion(
        decision_id=decision_id,
        user_id=current_user.id,
        comment=discussion.comment
    )

    db.add(new_discussion)
    db.commit()
    db.refresh(new_discussion)

    return new_discussion


@router.get(
    "/{decision_id}/discussions/",
    response_model=list[DiscussionResponse]
)
def get_discussions(
    decision_id: int,
    db: Session = Depends(get_db)
):
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    discussions = (
        db.query(Discussion)
        .filter(Discussion.decision_id == decision_id)
        .all()
    )

    return discussions


@router.get(
    "/{decision_id}/discussions/{discussion_id}",
    response_model=DiscussionResponse
)
def get_discussion(
    decision_id: int,
    discussion_id: int,
    db: Session = Depends(get_db)
):
    discussion = (
        db.query(Discussion)
        .filter(
            Discussion.id == discussion_id,
            Discussion.decision_id == decision_id
        )
        .first()
    )

    if not discussion:
        raise HTTPException(
            status_code=404,
            detail="Discussion not found"
        )

    return discussion


@router.delete(
    "/{decision_id}/discussions/{discussion_id}"
)
def delete_discussion(
    decision_id: int,
    discussion_id: int,
    db: Session = Depends(get_db)
):
    discussion = (
        db.query(Discussion)
        .filter(
            Discussion.id == discussion_id,
            Discussion.decision_id == decision_id
        )
        .first()
    )

    if not discussion:
        raise HTTPException(
            status_code=404,
            detail="Discussion not found"
        )

    db.delete(discussion)
    db.commit()

    return {
        "message": "Discussion deleted successfully"
    }