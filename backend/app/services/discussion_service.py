from typing import List, Optional, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Comment, Decision, User, Role, CommentType
from app.schemas import CommentCreate, CommentResponse, UserResponse
from app.services.decision_service import get_decision

def create_comment(
    db: Session,
    decision_id: int,
    comment_in: CommentCreate,
    current_user: User
) -> Comment:
    """Create a new discussion comment, meeting note, or rationale tag for a decision."""
    decision = get_decision(db, decision_id)

    # If parent_id provided, validate it belongs to this decision
    if comment_in.parent_id:
        parent = db.query(Comment).filter(
            Comment.id == comment_in.parent_id,
            Comment.decision_id == decision.id
        ).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent comment with ID {comment_in.parent_id} does not exist for this decision."
            )

    comment = Comment(
        decision_id=decision.id,
        author_id=current_user.id,
        parent_id=comment_in.parent_id,
        comment_type=comment_in.comment_type or CommentType.GENERAL_COMMENT,
        content=comment_in.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

def get_comment_by_id(db: Session, decision_id: int, comment_id: int) -> Comment:
    """Fetch single comment by ID."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.decision_id == decision_id
    ).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} was not found."
        )
    return comment

def delete_comment(db: Session, decision_id: int, comment_id: int, current_user: User) -> None:
    """Delete a comment."""
    comment = get_comment_by_id(db, decision_id, comment_id)
    is_author = comment.author_id == current_user.id
    is_admin_or_mgr = current_user.role in [Role.ADMINISTRATOR, Role.MANAGER]

    if not (is_author or is_admin_or_mgr):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this comment."
        )

    db.delete(comment)
    db.commit()

def _to_comment_response(comment: Comment, replies_map: Dict[int, List[Comment]]) -> CommentResponse:
    """Recursive helper to build nested threaded comment response."""
    author_resp = UserResponse.model_validate(comment.author) if comment.author else None
    
    child_comments = replies_map.get(comment.id, [])
    nested_replies = [
        _to_comment_response(child, replies_map)
        for child in child_comments
    ]

    return CommentResponse(
        id=comment.id,
        decision_id=comment.decision_id,
        author_id=comment.author_id,
        author=author_resp,
        parent_id=comment.parent_id,
        comment_type=comment.comment_type,
        content=comment.content,
        created_at=comment.created_at,
        replies=nested_replies
    )

def get_decision_comments_tree(db: Session, decision_id: int) -> List[CommentResponse]:
    """
    Retrieves all comments for a decision assembled into a hierarchical threaded tree structure.
    """
    get_decision(db, decision_id)
    all_comments = db.query(Comment).filter(
        Comment.decision_id == decision_id
    ).order_by(Comment.created_at.asc()).all()

    # Group replies by parent_id
    replies_map: Dict[int, List[Comment]] = {}
    top_level_comments: List[Comment] = []

    for c in all_comments:
        if c.parent_id is None:
            top_level_comments.append(c)
        else:
            replies_map.setdefault(c.parent_id, []).append(c)

    return [_to_comment_response(root, replies_map) for root in top_level_comments]
