from datetime import datetime, timezone
from typing import List, Optional, Sequence
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.notification import Notification, NotificationTypeEnum
from app.models.role import Role, RoleEnum
from app.models.user import User


def create_notification(
    db: Session,
    recipient_id: int,
    notification_type: NotificationTypeEnum,
    title: str,
    message: str,
    decision_id: Optional[int] = None,
    action_url: Optional[str] = None,
    skip_commit: bool = False,
) -> Notification:
    """
    Creates a single notification for a specific recipient user.
    Server-side recipient validation ensures users cannot inject target IDs.
    """
    notification = Notification(
        recipient_id=recipient_id,
        notification_type=notification_type.value if hasattr(notification_type, "value") else str(notification_type),
        title=title.strip(),
        message=message.strip(),
        decision_id=decision_id,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    if not skip_commit:
        db.commit()
        db.refresh(notification)

    # Audit logging for notification creation
    try:
        from app.models.audit_log import AuditActionEnum
        from app.services.audit_service import create_audit_log
        notif_type_val = notification_type.value if hasattr(notification_type, "value") else str(notification_type)
        create_audit_log(
            db=db,
            action=AuditActionEnum.NOTIFICATION_CREATED,
            entity_type="Notification",
            entity_id=notification.id,
            user_id=recipient_id,
            description=f"Notification created for user #{recipient_id}: {title}",
            details={
                "notification_id": notification.id,
                "recipient_id": recipient_id,
                "type": notif_type_val,
                "decision_id": decision_id,
            },
            skip_commit=skip_commit,
        )
    except Exception:
        pass

    return notification


def create_notifications_for_users(
    db: Session,
    recipient_ids: Sequence[int],
    notification_type: NotificationTypeEnum,
    title: str,
    message: str,
    decision_id: Optional[int] = None,
    exclude_user_id: Optional[int] = None,
    skip_commit: bool = False,
) -> List[Notification]:
    """
    Creates notifications for multiple users in bulk.
    Deduplicates recipient IDs and safely excludes the acting user.
    """
    unique_recipients = set()
    for uid in recipient_ids:
        if uid and (exclude_user_id is None or uid != exclude_user_id):
            unique_recipients.add(uid)

    created_notifications = []
    for recipient_id in unique_recipients:
        notif = Notification(
            recipient_id=recipient_id,
            notification_type=notification_type.value if hasattr(notification_type, "value") else str(notification_type),
            title=title.strip(),
            message=message.strip(),
            decision_id=decision_id,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notif)
        created_notifications.append(notif)

    if not skip_commit and created_notifications:
        db.commit()
        for notif in created_notifications:
            db.refresh(notif)

    return created_notifications


def get_user_notifications(
    db: Session,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    unread_only: bool = False,
) -> dict:
    """
    Retrieves paginated notifications strictly belonging to current_user.
    """
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    query = db.query(Notification).filter(Notification.recipient_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Notification.created_at.desc()).offset(offset).limit(page_size).all()

    unread_count = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .count()
    )

    # Attach computed action_url for frontend routing
    for item in items:
        if item.decision_id:
            setattr(item, "action_url", f"/decisions/{item.decision_id}")
        else:
            setattr(item, "action_url", "/notifications")

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "unread_count": unread_count,
    }


def get_unread_count(db: Session, current_user: User) -> int:
    """
    Returns the total unread notification count for the current user.
    """
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .count()
    )


def mark_notification_read(db: Session, notification_id: int, current_user: User) -> Notification:
    """
    Marks a single notification as read, enforcing that current_user is the recipient.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )

    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access or modify this notification."
        )

    if not notification.is_read:
        notification.is_read = True
        # Audit logging for marking notification read
        try:
            from app.models.audit_log import AuditActionEnum
            from app.services.audit_service import create_audit_log
            create_audit_log(
                db=db,
                action=AuditActionEnum.NOTIFICATION_READ,
                entity_type="Notification",
                entity_id=notification.id,
                user_id=current_user.id,
                description=f"Marked notification #{notification.id} as read",
                details={
                    "notification_id": notification.id,
                    "recipient_id": current_user.id,
                },
                skip_commit=True,
            )
        except Exception:
            pass

        db.commit()
        db.refresh(notification)

    if notification.decision_id:
        setattr(notification, "action_url", f"/decisions/{notification.decision_id}")
    else:
        setattr(notification, "action_url", "/notifications")

    return notification


def mark_all_notifications_read(db: Session, current_user: User) -> int:
    """
    Marks all unread notifications belonging strictly to the current user as read.
    """
    updated_count = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id, Notification.is_read == False)
        .update({"is_read": True}, synchronize_session="fetch")
    )
    if updated_count > 0:
        try:
            from app.models.audit_log import AuditActionEnum
            from app.services.audit_service import create_audit_log
            create_audit_log(
                db=db,
                action=AuditActionEnum.NOTIFICATION_READ,
                entity_type="Notification",
                entity_id=None,
                user_id=current_user.id,
                description=f"Marked {updated_count} notifications as read",
                details={
                    "user_id": current_user.id,
                    "updated_count": updated_count,
                    "bulk": True,
                },
                skip_commit=True,
            )
        except Exception:
            pass

    db.commit()
    return updated_count


def get_notification_by_id(db: Session, notification_id: int, current_user: User) -> Notification:
    """
    Returns a single notification, verifying that the current_user is the recipient.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )

    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this notification."
        )

    if notification.decision_id:
        setattr(notification, "action_url", f"/decisions/{notification.decision_id}")
    else:
        setattr(notification, "action_url", "/notifications")

    return notification


# -----------------------------------------------------------------------------
# Domain Workflow Trigger Helpers
# -----------------------------------------------------------------------------

def notify_decision_submitted(db: Session, decision: Decision, actor: User) -> List[Notification]:
    """
    Notifies eligible reviewers (Reviewer, Manager, Administrator) when a decision is submitted.
    Excludes the submitting actor and creator.
    """
    eligible_roles = [
        RoleEnum.REVIEWER.value,
        RoleEnum.MANAGER.value,
        RoleEnum.ADMINISTRATOR.value,
    ]
    reviewers = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .filter(Role.name.in_(eligible_roles), User.is_active == True)
        .all()
    )
    recipient_ids = [u.id for u in reviewers if u.id != actor.id]

    title = "Decision Submitted for Review"
    message = f'Decision "{decision.title}" has been submitted for evaluation and approval.'

    return create_notifications_for_users(
        db=db,
        recipient_ids=recipient_ids,
        notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
        title=title,
        message=message,
        decision_id=decision.id,
        exclude_user_id=actor.id,
        skip_commit=True,
    )


def notify_decision_approved(db: Session, decision: Decision, actor: User, comment: Optional[str] = None) -> Optional[Notification]:
    """
    Notifies the decision owner that their decision was approved.
    Avoids notifying the reviewer themselves if they happen to be the owner.
    """
    if decision.created_by == actor.id:
        return None

    title = "Decision Approved"
    message = f'Your decision "{decision.title}" has been approved.'
    if comment and comment.strip():
        message += f' Reviewer notes: "{comment.strip()}"'

    return create_notification(
        db=db,
        recipient_id=decision.created_by,
        notification_type=NotificationTypeEnum.DECISION_APPROVED,
        title=title,
        message=message,
        decision_id=decision.id,
        skip_commit=True,
    )


def notify_decision_rejected(db: Session, decision: Decision, actor: User, reason: str, comment: Optional[str] = None) -> Optional[Notification]:
    """
    Notifies the decision owner that their decision was rejected, noting the rejection reason.
    Avoids notifying the reviewer themselves.
    """
    if decision.created_by == actor.id:
        return None

    title = "Decision Rejected"
    message = f'Your decision "{decision.title}" was rejected. Rejection reason: "{reason.strip()}".'
    if comment and comment.strip():
        message += f' Additional notes: "{comment.strip()}".'

    return create_notification(
        db=db,
        recipient_id=decision.created_by,
        notification_type=NotificationTypeEnum.DECISION_REJECTED,
        title=title,
        message=message,
        decision_id=decision.id,
        skip_commit=True,
    )


def notify_discussion_created(db: Session, decision: Decision, actor: User, topic: str) -> List[Notification]:
    """
    Notifies the decision creator and previous discussion participants when a new discussion topic is created.
    """
    recipient_ids = {decision.created_by}
    # Also collect previous participants if any
    for disc in decision.discussions:
        if disc.user_id:
            recipient_ids.add(disc.user_id)

    recipient_ids.discard(actor.id)
    if not recipient_ids:
        return []

    title = "New Discussion"
    message = f'{actor.full_name} started a new discussion "{topic}" on decision "{decision.title}".'

    return create_notifications_for_users(
        db=db,
        recipient_ids=list(recipient_ids),
        notification_type=NotificationTypeEnum.DISCUSSION_CREATED,
        title=title,
        message=message,
        decision_id=decision.id,
        exclude_user_id=actor.id,
        skip_commit=True,
    )


def notify_discussion_reply(
    db: Session,
    decision: Decision,
    actor: User,
    discussion_topic: str,
    parent_discussion_author_id: int,
    participant_user_ids: Sequence[int] = (),
) -> List[Notification]:
    """
    Notifies the discussion author and participants when a reply is posted.
    """
    recipient_ids = {parent_discussion_author_id, decision.created_by}
    for pid in participant_user_ids:
        if pid:
            recipient_ids.add(pid)

    recipient_ids.discard(actor.id)
    if not recipient_ids:
        return []

    title = "New Discussion Reply"
    message = f'{actor.full_name} replied to discussion "{discussion_topic}" on decision "{decision.title}".'

    return create_notifications_for_users(
        db=db,
        recipient_ids=list(recipient_ids),
        notification_type=NotificationTypeEnum.DISCUSSION_REPLY,
        title=title,
        message=message,
        decision_id=decision.id,
        exclude_user_id=actor.id,
        skip_commit=True,
    )


def notify_document_uploaded(db: Session, decision: Decision, actor: User, filename: str) -> List[Notification]:
    """
    Notifies the decision owner and relevant stakeholders when a new document is attached.
    """
    recipient_ids = {decision.created_by}
    # If author uploaded, notify reviewer roles or administrators
    if actor.id == decision.created_by:
        admin_users = (
            db.query(User)
            .join(Role, User.role_id == Role.id)
            .filter(Role.name == RoleEnum.ADMINISTRATOR.value, User.is_active == True)
            .all()
        )
        for u in admin_users:
            recipient_ids.add(u.id)

    recipient_ids.discard(actor.id)
    if not recipient_ids:
        return []

    title = "New Document Uploaded"
    message = f'Document "{filename}" was uploaded for decision "{decision.title}".'

    return create_notifications_for_users(
        db=db,
        recipient_ids=list(recipient_ids),
        notification_type=NotificationTypeEnum.DOCUMENT_UPLOADED,
        title=title,
        message=message,
        decision_id=decision.id,
        exclude_user_id=actor.id,
        skip_commit=True,
    )


def notify_decision_updated(db: Session, decision: Decision, actor: User, change_summary: str) -> List[Notification]:
    """
    Notifies interested users when a decision is meaningfully updated.
    Does not trigger if change_summary is empty.
    """
    if not change_summary or not change_summary.strip():
        return []

    recipient_ids = {decision.created_by}
    # Add participants from discussions
    for disc in decision.discussions:
        if disc.user_id:
            recipient_ids.add(disc.user_id)

    recipient_ids.discard(actor.id)
    if not recipient_ids:
        return []

    title = "Decision Updated"
    message = f'Decision "{decision.title}" was updated ({change_summary}).'

    return create_notifications_for_users(
        db=db,
        recipient_ids=list(recipient_ids),
        notification_type=NotificationTypeEnum.DECISION_UPDATED,
        title=title,
        message=message,
        decision_id=decision.id,
        exclude_user_id=actor.id,
        skip_commit=True,
    )
