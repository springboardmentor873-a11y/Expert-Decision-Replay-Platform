from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import CommentCreate, CommentResponse, UserResponse
from app.auth import get_current_active_user
from app.services import discussion_service

router = APIRouter(prefix="/decisions", tags=["Discussion & Collaboration Engine"])

@router.post("/{id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def post_comment(
    id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Post a comment, meeting note, or architectural rationale to a decision. Supports parent_id for threaded replies.
    """
    comment = discussion_service.create_comment(db, id, comment_in, current_user)
    author_resp = UserResponse.model_validate(current_user)
    return CommentResponse(
        id=comment.id,
        decision_id=comment.decision_id,
        author_id=comment.author_id,
        author=author_resp,
        parent_id=comment.parent_id,
        comment_type=comment.comment_type,
        content=comment.content,
        created_at=comment.created_at,
        replies=[]
    )

@router.get("/{id}/comments", response_model=List[CommentResponse])
def get_comments_thread(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch the complete hierarchical threaded discussion tree for a decision.
    """
    return discussion_service.get_decision_comments_tree(db, id)

@router.delete("/{id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a comment or meeting note.
    """
    discussion_service.delete_comment(db, id, comment_id, current_user)
    return None
