from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from datetime import datetime

from typing import Optional

from app.database import get_db
from app.models import Notification
from app.models import Decision
from app.models import User
from app.models import Role
from app.auth import get_current_user


# ==========================================
# ROUTER
# ==========================================

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==========================================
# HELPER: NOTIFICATION DICT
# ==========================================

def notification_dict(notification):

    return {
        "notification_id": notification.notification_id,
        "user_id": notification.user_id,
        "decision_id": notification.decision_id,
        "decision_title": (
            notification.decision.title
            if notification.decision
            else None
        ),
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "is_read": bool(notification.is_read),
        "created_at": notification.created_at
    }


# ==========================================
# HELPER: CREATE NOTIFICATION
# ==========================================

def create_notification(
    db: Session,
    user_id: int,
    decision_id: Optional[int],
    title: str,
    message: str,
    notification_type: str
):

    notification = Notification(
        user_id=user_id,
        decision_id=decision_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
        created_at=datetime.utcnow()
    )

    db.add(notification)

    return notification


# ==========================================
# HELPER: WORKFLOW NOTIFICATIONS
# ==========================================

def create_workflow_notifications(
    db: Session,
    decision: Decision,
    old_status: str,
    new_status: str,
    reason: Optional[str] = None
):

    try:

        decision_id = decision.decision_id

        title = decision.title

        if old_status == "Draft" and new_status == "Under Review":
            reviewers = (
                db.query(User)
                .filter(User.role_id == 2)
                .all()
            )

            for reviewer in reviewers:
                create_notification(
                    db,
                    reviewer.user_id,
                    decision_id,
                    "Decision Submitted for Review",
                    f"{title} has been submitted for review.",
                    "submitted"
                )

        elif (
            old_status == "Under Review"
            and new_status == "Reviewer Approved"
        ):
            managers = (
                db.query(User)
                .filter(User.role_id == 3)
                .all()
            )

            for manager in managers:
                create_notification(
                    db,
                    manager.user_id,
                    decision_id,
                    "Manager Approval Required",
                    (
                        f"{title} has been approved by the "
                        "Reviewer and is waiting for "
                        "Manager approval."
                    ),
                    "manager_required"
                )

        elif old_status == "Under Review" and new_status == "Rejected":
            message = (
                f"{title} was rejected by the Reviewer."
            )

            if reason and reason.strip():
                message += (
                    f" Reason: {reason.strip()}"
                )

            create_notification(
                db,
                decision.expert_id,
                decision_id,
                "Decision Rejected",
                message,
                "rejected"
            )

        elif (
            old_status == "Reviewer Approved"
            and new_status == "Approved"
        ):
            create_notification(
                db,
                decision.expert_id,
                decision_id,
                "Decision Approved",
                (
                    f"{title} has been approved "
                    "by the Manager."
                ),
                "approved"
            )

        elif (
            old_status == "Reviewer Approved"
            and new_status == "Rejected"
        ):
            message = (
                f"{title} was rejected by the Manager."
            )

            if reason and reason.strip():
                message += (
                    f" Reason: {reason.strip()}"
                )

            create_notification(
                db,
                decision.expert_id,
                decision_id,
                "Decision Rejected",
                message,
                "rejected"
            )

        elif (
            old_status == "Approved"
            and new_status == "Archived"
        ):
            create_notification(
                db,
                decision.expert_id,
                decision_id,
                "Decision Archived",
                f"{title} has been archived.",
                "archived"
            )

    except Exception as exc:
        print("Notification creation failed:", exc)


# ==========================================
# GET ALL NOTIFICATIONS (OWN ONLY)
# ==========================================

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return [
        notification_dict(n)
        for n in notifications
    ]


# ==========================================
# GET UNREAD NOTIFICATION COUNT
# ==========================================

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False)
        )
        .count()
    )

    return {
        "unread_count": count
    }


# ==========================================
# MARK SINGLE NOTIFICATION AS READ
# ==========================================

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id
        )
        .first()
    )

    if not notification:

        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    if notification.user_id != current_user.user_id:

        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to access this notification"
            )
        )

    notification.is_read = True

    db.commit()

    db.refresh(notification)

    return notification_dict(notification)


# ==========================================
# MARK ALL NOTIFICATIONS AS READ
# ==========================================

@router.post("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False)
        )
        .all()
    )

    for notification in notifications:

        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated": len(notifications)
    }