from datetime import datetime

from sqlalchemy.orm import Session

from app.models import AuditLog


# ==========================================
# AUDIT ACTIONS
# ==========================================

ACTION_DECISION_CREATED = "DECISION_CREATED"
ACTION_DECISION_UPDATED = "DECISION_UPDATED"
ACTION_DECISION_SUBMITTED = "DECISION_SUBMITTED_FOR_REVIEW"
ACTION_REVIEWER_APPROVED = "REVIEWER_APPROVED"
ACTION_REVIEWER_REJECTED = "REVIEWER_REJECTED"
ACTION_MANAGER_APPROVED = "MANAGER_APPROVED"
ACTION_MANAGER_REJECTED = "MANAGER_REJECTED"
ACTION_DECISION_ARCHIVED = "DECISION_ARCHIVED"
ACTION_DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
ACTION_DOCUMENT_DELETED = "DOCUMENT_DELETED"
ACTION_LOGIN_SUCCESS = "LOGIN_SUCCESS"
ACTION_LOGIN_FAILED = "LOGIN_FAILED"


# ==========================================
# RECORD AUDIT LOG
# ==========================================
# Audit logs are strictly append-only. This helper is the only
# place audit records are created; there are no endpoints to
# update or delete them.

def record_audit(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    entity_type: str = "Decision",
    entity_id: int = None,
    decision_id: int = None,
    old_value: str = None,
    new_value: str = None
):

    try:

        log = AuditLog(
            user_id=user_id,
            action=action,
            decision_id=decision_id,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            description=description,
            created_at=datetime.utcnow()
        )

        db.add(log)

    except Exception as exc:
        print("Audit log creation failed:", exc)


# ==========================================
# WORKFLOW AUDIT ACTION
# ==========================================
# Maps an approval-workflow status transition to the audit
# action that must be recorded.

def workflow_audit_action(
    old_status: str,
    new_status: str
):

    if old_status == "Draft" and new_status == "Under Review":
        return ACTION_DECISION_SUBMITTED, (
            f"Decision submitted for review "
            f"({old_status} -> {new_status})"
        )

    if (
        old_status == "Under Review"
        and new_status == "Reviewer Approved"
    ):
        return ACTION_REVIEWER_APPROVED, (
            f"Reviewer approved the decision "
            f"({old_status} -> {new_status})"
        )

    if old_status == "Under Review" and new_status == "Rejected":
        return ACTION_REVIEWER_REJECTED, (
            f"Reviewer rejected the decision "
            f"({old_status} -> {new_status})"
        )

    if (
        old_status == "Reviewer Approved"
        and new_status == "Approved"
    ):
        return ACTION_MANAGER_APPROVED, (
            f"Manager approved the decision "
            f"({old_status} -> {new_status})"
        )

    if (
        old_status == "Reviewer Approved"
        and new_status == "Rejected"
    ):
        return ACTION_MANAGER_REJECTED, (
            f"Manager rejected the decision "
            f"({old_status} -> {new_status})"
        )

    if old_status == "Approved" and new_status == "Archived":
        return ACTION_DECISION_ARCHIVED, (
            f"Decision archived "
            f"({old_status} -> {new_status})"
        )

    return None, None


# ==========================================
# RECORD WORKFLOW STATUS AUDIT LOG
# ==========================================

def record_workflow_audit(
    db: Session,
    user_id: int,
    decision,
    old_status: str,
    new_status: str,
    reason: str = None
):

    action, description = workflow_audit_action(
        old_status,
        new_status
    )

    if action is None:
        return

    if reason and reason.strip():
        description += f" Reason: {reason.strip()}"

    record_audit(
        db,
        user_id=user_id,
        action=action,
        description=description,
        entity_type="Decision",
        entity_id=decision.decision_id,
        decision_id=decision.decision_id,
        old_value=old_status,
        new_value=new_status
    )


# ==========================================
# DECISION CREATED AUDIT LOG
# ==========================================

def record_decision_created_audit(
    db: Session,
    user_id: int,
    decision
):

    record_audit(
        db,
        user_id=user_id,
        action=ACTION_DECISION_CREATED,
        description=(
            f"Decision '{decision.title}' created "
            f"with status '{decision.status}'"
        ),
        entity_type="Decision",
        entity_id=decision.decision_id,
        decision_id=decision.decision_id,
        new_value=decision.status
    )


# ==========================================
# DECISION UPDATED AUDIT LOG
# ==========================================

def record_decision_updated_audit(
    db: Session,
    user_id: int,
    decision,
    changes
):

    if not changes:
        return

    old_parts = []

    new_parts = []

    field_parts = []

    for change in changes:

        field = change.get("field")

        old_value = change.get("old")

        new_value = change.get("new")

        field_parts.append(field)

        old_parts.append(f"{field}: {old_value}")

        new_parts.append(f"{field}: {new_value}")

    record_audit(
        db,
        user_id=user_id,
        action=ACTION_DECISION_UPDATED,
        description=(
            "Decision updated: "
            + "; ".join(field_parts)
        ),
        entity_type="Decision",
        entity_id=decision.decision_id,
        decision_id=decision.decision_id,
        old_value="\n".join(old_parts),
        new_value="\n".join(new_parts)
    )


# ==========================================
# AUDIT LOG DICT
# ==========================================

def audit_log_dict(log):
    return {
        "log_id": log.log_id,
        "user_id": log.user_id,
        "user_name": log.user.name if log.user else None,
        "user_email": log.user.email if log.user else None,
        "action": log.action,
        "entity_type": log.entity_type or "Decision",
        "entity_id": log.entity_id,
        "decision_id": log.decision_id,
        "decision_title": (
            log.decision.title if log.decision else None
        ),
        "old_value": log.old_value,
        "new_value": log.new_value,
        "description": log.description,
        "created_at": log.created_at
    }