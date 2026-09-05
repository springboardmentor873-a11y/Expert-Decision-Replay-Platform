from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.decision import Decision
from models.comment import Comment
from models.user import User
from Schemas.comment import CommentCreate, CommentOut

router = APIRouter(prefix="/decisions/{decision_id}/comments", tags=["Discussion"])


@router.post("", response_model=CommentOut, status_code=201)
def add_comment(
    decision_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if payload.parent_id:
        parent = db.query(Comment).filter(Comment.id == payload.parent_id).first()
        if not parent or parent.decision_id != decision_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    comment = Comment(
        decision_id=decision_id,
        user_id=current_user.id,
        parent_id=payload.parent_id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("", response_model=List[CommentOut])
def list_comments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    return (
        db.query(Comment)
        .filter(Comment.decision_id == decision_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    decision_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.decision_id == decision_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only the author or an administrator can delete a comment
    role_name = current_user.role.name if current_user.role else None
    if comment.user_id != current_user.id and role_name != "administrator":
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")

    db.delete(comment)
    db.commit()
    return None
