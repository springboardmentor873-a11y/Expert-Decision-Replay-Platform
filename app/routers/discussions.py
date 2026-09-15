"""
Discussions router — cross-decision "My Discussions" view.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.approval import Approval
from app.models.decision import Decision
from app.models.discussion_thread import DiscussionThread
from app.models.thread_reply import ThreadReply
from app.models.user import User

router = APIRouter(prefix="/discussions", tags=["Discussions"])


# ------------------------------------------------------------------ #
# GET /discussions/mine                                                 #
# ------------------------------------------------------------------ #
@router.get("/mine")
def my_discussions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all discussion threads the current user started OR replied in,
    across every decision they can access, ordered most-recent first.
    """
    # Threads the user started
    started_ids = set(
        row[0]
        for row in db.query(DiscussionThread.id)
        .filter(DiscussionThread.user_id == current_user.id)
        .all()
    )

    # Threads the user replied in
    replied_ids = set(
        row[0]
        for row in db.query(ThreadReply.thread_id)
        .filter(ThreadReply.user_id == current_user.id)
        .all()
    )

    all_thread_ids = started_ids | replied_ids
    if not all_thread_ids:
        return []

    threads = (
        db.query(DiscussionThread)
        .filter(DiscussionThread.id.in_(all_thread_ids))
        .order_by(DiscussionThread.updated_at.desc())
        .all()
    )

    # Build user lookup for actor names
    user_ids = {t.user_id for t in threads}
    users_by_id = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }

    result = []
    for thread in threads:
        # Verify the user can still access the parent decision
        decision = db.query(Decision).filter(Decision.id == thread.decision_id).first()
        if not decision:
            continue

        # Row-level auth: skip decisions the user can no longer access
        if current_user.role == "Employee" and decision.created_by != current_user.id:
            continue
        if current_user.role == "Manager":
            creator = db.query(User).filter(User.id == decision.created_by).first()
            if not creator or creator.department != current_user.department:
                # check if user is the thread author
                if thread.user_id != current_user.id:
                    continue
        if current_user.role == "Reviewer":
            has_approval = (
                db.query(Approval)
                .filter(
                    Approval.decision_id == decision.id,
                    Approval.reviewer_id == current_user.id,
                )
                .first()
            )
            if not has_approval and decision.created_by != current_user.id:
                continue

        reply_count = (
            db.query(ThreadReply)
            .filter(ThreadReply.thread_id == thread.id)
            .count()
        )

        author = users_by_id.get(thread.user_id)
        result.append(
            {
                "id": thread.id,
                "title": thread.title,
                "content": thread.content,
                "decision_id": thread.decision_id,
                "decision_title": decision.title,
                "user_id": thread.user_id,
                "author_name": author.full_name if author else "Unknown",
                "reply_count": reply_count,
                "created_at": thread.created_at,
                "updated_at": thread.updated_at,
            }
        )

    return result
