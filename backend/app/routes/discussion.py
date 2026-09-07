from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from datetime import datetime

from app.database import get_db
from app.models import Decision
from app.models import DecisionComment
from app.auth import get_current_user
from app.schemas import CommentCreate
from app.schemas import CommentUpdate
from app.routes.decisions import record_version


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/decisions",
    tags=["Decision Discussion"]
)


# ==========================================
# HELPER: GET DECISION OR 404
# ==========================================

def get_decision_or_404(
    db: Session,
    decision_id: int
):

    decision = (
        db.query(Decision)
        .filter(
            Decision.decision_id == decision_id
        )
        .first()
    )

    if not decision:

        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    return decision


# ==========================================
# HELPER: GET COMMENT OR 404
# ==========================================

def get_comment_or_404(
    db: Session,
    decision_id: int,
    comment_id: int
):

    comment = (
        db.query(DecisionComment)
        .filter(
            DecisionComment.comment_id == comment_id,
            DecisionComment.decision_id == decision_id
        )
        .first()
    )

    if not comment:

        raise HTTPException(
            status_code=404,
            detail="Comment not found"
        )

    return comment


# ==========================================
# HELPER: COMMENT DICT
# ==========================================

def comment_dict(comment):

    return {
        "comment_id": comment.comment_id,
        "decision_id": comment.decision_id,
        "user_id": comment.user_id,
        "author_name": (
            comment.author.name
            if comment.author
            else None
        ),
        "content": comment.content,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at
    }


# ==========================================
# HELPER: CAN MANAGE COMMENT
# ==========================================

def can_manage(
    decision: Decision,
    current_user,
    comment: DecisionComment = None
):

    if current_user.user_id == decision.expert_id:
        return True

    if current_user.role_id == 4:
        return True

    if (
        comment is not None
        and comment.user_id == current_user.user_id
    ):
        return True

    return False


def require_manage_access(
    decision: Decision,
    current_user,
    comment: DecisionComment = None
):

    if not can_manage(decision, current_user, comment):

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to modify "
                "comments for this decision"
            )
        )


# ==========================================
# LIST COMMENTS (DISCUSSION THREAD)
# ==========================================

@router.get("/{decision_id}/comments")
def get_comments(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    get_decision_or_404(db, decision_id)

    comments = (
        db.query(DecisionComment)
        .filter(
            DecisionComment.decision_id == decision_id
        )
        .order_by(
            DecisionComment.comment_id.asc()
        )
        .all()
    )

    return [
        comment_dict(c)
        for c in comments
    ]


# ==========================================
# CREATE COMMENT
# ==========================================

@router.post("/{decision_id}/comments")
def create_comment(
    decision_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    if not comment_data.content.strip():

        raise HTTPException(
            status_code=422,
            detail="Comment content is required"
        )

    now = datetime.utcnow()

    new_comment = DecisionComment(
        decision_id=decision_id,
        user_id=current_user.user_id,
        content=comment_data.content.strip(),
        created_at=now,
        updated_at=now
    )

    db.add(new_comment)

    record_version(
        db,
        decision,
        current_user,
        "Discussion comment added"
    )

    db.commit()

    db.refresh(new_comment)

    return comment_dict(new_comment)


# ==========================================
# UPDATE COMMENT
# ==========================================

@router.put("/{decision_id}/comments/{comment_id}")
def update_comment(
    decision_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    comment = get_comment_or_404(
        db,
        decision_id,
        comment_id
    )

    require_manage_access(decision, current_user, comment)

    if not comment_data.content.strip():

        raise HTTPException(
            status_code=422,
            detail="Comment content cannot be empty"
        )

    comment.content = comment_data.content.strip()
    comment.updated_at = datetime.utcnow()

    record_version(
        db,
        decision,
        current_user,
        "Discussion comment updated"
    )

    db.commit()

    db.refresh(comment)

    return comment_dict(comment)


# ==========================================
# DELETE COMMENT
# ==========================================

@router.delete("/{decision_id}/comments/{comment_id}")
def delete_comment(
    decision_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    decision = get_decision_or_404(db, decision_id)

    comment = get_comment_or_404(
        db,
        decision_id,
        comment_id
    )

    require_manage_access(decision, current_user, comment)

    db.delete(comment)

    record_version(
        db,
        decision,
        current_user,
        "Discussion comment deleted"
    )

    db.commit()

    return {
        "message": "Comment deleted successfully",
        "decision_id": decision_id
    }
