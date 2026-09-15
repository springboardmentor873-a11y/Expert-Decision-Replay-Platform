from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.comment import Comment
from app.models.decision import Decision
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.audit_service import log_audit
from app.services.activity_service import log_activity
from app.services.authorization import assert_can_access_decision


router = APIRouter(
    prefix="/decisions",
    tags=["Comments"]
)


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


# CREATE COMMENT
@router.post(
    "/{decision_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_comment(
    decision_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    comment = Comment(
        decision_id=decision_id,
        user_id=current_user.id,
        content=comment_data.content
    )

    db.add(comment)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.COMMENT,
        entity_id=comment.id,
        description=(
            f"User {current_user.id} created "
            f"Comment {comment.id} for Decision {decision_id}"
        ),
        new_value={
            "content": comment.content
        },
        request_method="POST",
        endpoint=f"/decisions/{decision_id}/comments"
    )

    log_activity(
        db=db,
        user_id=current_user.id,
        action="Comment Added",
        entity_type="Comment",
        entity_id=comment.id,
        description=f"{current_user.full_name} commented on decision '{decision.title}'"
    )

    db.commit()
    db.refresh(comment)

    return comment


# GET ALL COMMENTS FOR A DECISION
@router.get(
    "/{decision_id}/comments",
    response_model=list[CommentResponse]
)
def get_comments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decision = _get_decision_or_404(db, decision_id)
    assert_can_access_decision(current_user, decision, db)

    return (
        db.query(Comment)
        .filter(
            Comment.decision_id == decision_id
        )
        .order_by(
            Comment.created_at.asc()
        )
        .all()
    )


# UPDATE COMMENT
@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse
)
def update_comment(
    comment_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own comment"
        )

    old_content = comment.content

    comment.content = comment_data.content

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.COMMENT,
        entity_id=comment.id,
        description=(
            f"User {current_user.id} updated "
            f"Comment {comment.id}"
        ),
        old_value={
            "content": old_content
        },
        new_value={
            "content": comment.content
        },
        request_method="PUT",
        endpoint=f"/decisions/comments/{comment.id}"
    )

    db.commit()
    db.refresh(comment)

    return comment


# DELETE COMMENT
@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_200_OK
)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment.user_id != current_user.id and current_user.role not in (
        "Manager",
        "Administrator",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comment"
        )

    old_content = comment.content

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.DELETE,
        entity_type=AuditEntityType.COMMENT,
        entity_id=comment.id,
        description=(
            f"User {current_user.id} deleted "
            f"Comment {comment.id}"
        ),
        old_value={
            "content": old_content
        },
        request_method="DELETE",
        endpoint=f"/decisions/comments/{comment.id}"
    )

    db.delete(comment)
    db.commit()

    return {
        "message": "Comment deleted successfully"
    }
