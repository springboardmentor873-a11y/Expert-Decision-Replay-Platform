from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.approval_workflow import (
    ApprovalWorkflow,
    ApprovalStep,
    WorkflowStatusEnum,
    StepStatusEnum,
)
from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import RoleEnum
from app.models.user import User
from app.models.notification import Notification, NotificationTypeEnum
from app.models.audit_log import AuditActionEnum
from app.schemas.approval_workflow import (
    ApprovalWorkflowCreateRequest,
    ApprovalStepActionRequest,
)
from app.services.audit_service import create_audit_log


def _serialize_workflow(wf: ApprovalWorkflow) -> dict:
    now = datetime.now(timezone.utc)
    steps_data = []
    current_step = None

    for s in wf.steps:
        # Determine overdue status: timezone-aware comparison
        due = s.due_date
        is_overdue = False
        if due and s.status == StepStatusEnum.PENDING.value:
            if due.tzinfo is None:
                is_overdue = due < datetime.utcnow()
            else:
                is_overdue = due < now

        if s.status == StepStatusEnum.PENDING.value and current_step is None:
            current_step = s.step_number

        steps_data.append({
            "id": s.id,
            "workflow_id": s.workflow_id,
            "step_number": s.step_number,
            "reviewer_id": s.reviewer_id,
            "reviewer_name": s.reviewer.full_name if s.reviewer else None,
            "reviewer_email": s.reviewer.email if s.reviewer else None,
            "status": s.status,
            "comments": s.comments,
            "due_date": s.due_date,
            "acted_at": s.acted_at,
            "is_overdue": is_overdue,
        })

    return {
        "id": wf.id,
        "decision_id": wf.decision_id,
        "name": wf.name,
        "status": wf.status,
        "created_by": wf.created_by,
        "creator_name": wf.creator.full_name if wf.creator else None,
        "created_at": wf.created_at,
        "updated_at": wf.updated_at,
        "steps": steps_data,
        "current_step_number": current_step,
    }


def get_workflows_for_decision(db: Session, decision_id: int) -> List[dict]:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision #{decision_id} not found.")

    workflows = db.query(ApprovalWorkflow).options(
        joinedload(ApprovalWorkflow.creator),
        joinedload(ApprovalWorkflow.steps).joinedload(ApprovalStep.reviewer)
    ).filter(ApprovalWorkflow.decision_id == decision_id).order_by(ApprovalWorkflow.created_at.desc()).all()

    return [_serialize_workflow(wf) for wf in workflows]


def create_approval_workflow(
    db: Session,
    decision_id: int,
    workflow_in: ApprovalWorkflowCreateRequest,
    current_user: User,
) -> dict:
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision #{decision_id} not found.")

    if decision.status == DecisionStatusEnum.ARCHIVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create approval workflow for an archived decision."
        )

    # Validate reviewers: check user existence and self-review restriction
    seen_steps = set()
    for step_in in workflow_in.steps:
        if step_in.step_number in seen_steps:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate step number {step_in.step_number} in workflow."
            )
        seen_steps.add(step_in.step_number)

        rev = db.query(User).filter(User.id == step_in.reviewer_id).first()
        if not rev:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reviewer user ID {step_in.reviewer_id} not found."
            )
        if step_in.reviewer_id == decision.created_by:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Self-review restriction: Decision creator cannot be assigned as an approval reviewer."
            )

    wf = ApprovalWorkflow(
        decision_id=decision_id,
        name=workflow_in.name or "Multi-Level Approval Workflow",
        status=WorkflowStatusEnum.PENDING.value,
        created_by=current_user.id
    )
    db.add(wf)
    db.flush()

    sorted_steps = sorted(workflow_in.steps, key=lambda s: s.step_number)
    for s_in in sorted_steps:
        step = ApprovalStep(
            workflow_id=wf.id,
            step_number=s_in.step_number,
            reviewer_id=s_in.reviewer_id,
            due_date=s_in.due_date,
            status=StepStatusEnum.PENDING.value
        )
        db.add(step)

    # Update decision status to Under Review
    if decision.status in (DecisionStatusEnum.DRAFT.value, DecisionStatusEnum.SUBMITTED.value):
        decision.status = DecisionStatusEnum.UNDER_REVIEW.value

    db.commit()
    db.refresh(wf)

    # Notify first reviewer
    first_step = sorted_steps[0]
    notif = Notification(
        recipient_id=first_step.reviewer_id,
        decision_id=decision_id,
        title="Approval Requested (Level 1)",
        message=f"You have been assigned to review decision '{decision.title}' at Step 1.",
        notification_type=NotificationTypeEnum.DECISION_SUBMITTED.value
    )
    db.add(notif)
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action=AuditActionEnum.WORKFLOW_CREATED.value,
        entity_type="ApprovalWorkflow",
        entity_id=wf.id,
        description=f"User '{current_user.full_name}' created {len(sorted_steps)}-step approval workflow for decision #{decision_id}."
    )

    # Re-fetch with joined relationships
    full_wf = db.query(ApprovalWorkflow).options(
        joinedload(ApprovalWorkflow.creator),
        joinedload(ApprovalWorkflow.steps).joinedload(ApprovalStep.reviewer)
    ).filter(ApprovalWorkflow.id == wf.id).first()

    return _serialize_workflow(full_wf)


def act_on_step(
    db: Session,
    workflow_id: int,
    step_id: int,
    action_in: ApprovalStepActionRequest,
    current_user: User,
) -> dict:
    step = db.query(ApprovalStep).options(
        joinedload(ApprovalStep.workflow).joinedload(ApprovalWorkflow.decision),
        joinedload(ApprovalStep.reviewer)
    ).filter(
        ApprovalStep.id == step_id,
        ApprovalStep.workflow_id == workflow_id
    ).first()

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval step not found.")

    wf = step.workflow
    decision = wf.decision
    role_name = current_user.role.name if current_user.role else ""
    is_admin = role_name == RoleEnum.ADMINISTRATOR.value

    # Permissions: assigned reviewer or Admin
    if step.reviewer_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to act on this approval step."
        )

    # Self-review restriction
    if decision.created_by == current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Decision creators cannot review or approve their own decisions."
        )

    if step.status != StepStatusEnum.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot act on step with status '{step.status}'."
        )

    # Sequential enforcement: check if any prior step is not Approved
    prior_unapproved = db.query(ApprovalStep).filter(
        ApprovalStep.workflow_id == workflow_id,
        ApprovalStep.step_number < step.step_number,
        ApprovalStep.status != StepStatusEnum.APPROVED.value
    ).first()

    if prior_unapproved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prior step {prior_unapproved.step_number} must be approved before acting on step {step.step_number}."
        )

    act = action_in.action.strip().capitalize()
    if act not in ("Approved", "Rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be either 'Approved' or 'Rejected'."
        )

    now = datetime.now(timezone.utc)
    step.comments = action_in.comments.strip() if action_in.comments else None
    step.acted_at = now

    if act == "Approved":
        step.status = StepStatusEnum.APPROVED.value
        create_audit_log(
            db=db,
            user_id=current_user.id,
            action=AuditActionEnum.WORKFLOW_STEP_APPROVED.value,
            entity_type="ApprovalStep",
            entity_id=step.id,
            description=f"User '{current_user.full_name}' approved Step {step.step_number} for decision #{decision.id}."
        )

        # Check next step
        next_step = db.query(ApprovalStep).filter(
            ApprovalStep.workflow_id == workflow_id,
            ApprovalStep.step_number > step.step_number,
            ApprovalStep.status == StepStatusEnum.PENDING.value
        ).order_by(ApprovalStep.step_number.asc()).first()

        if next_step:
            # Notify next reviewer
            notif = Notification(
                recipient_id=next_step.reviewer_id,
                decision_id=decision.id,
                title=f"Approval Requested (Level {next_step.step_number})",
                message=f"Step {step.step_number} was approved. You are now requested to review decision '{decision.title}'.",
                notification_type=NotificationTypeEnum.DECISION_SUBMITTED.value
            )
            db.add(notif)
        else:
            # All steps approved!
            wf.status = WorkflowStatusEnum.APPROVED.value
            decision.status = DecisionStatusEnum.APPROVED.value
            create_audit_log(
                db=db,
                user_id=current_user.id,
                action=AuditActionEnum.DECISION_APPROVED.value,
                entity_type="Decision",
                entity_id=decision.id,
                description=f"Decision #{decision.id} was fully APPROVED via multi-level workflow."
            )
            notif = Notification(
                recipient_id=decision.created_by,
                decision_id=decision.id,
                title="Decision Approved",
                message=f"Your decision '{decision.title}' has received final multi-level approval!",
                notification_type=NotificationTypeEnum.DECISION_APPROVED.value
            )
            db.add(notif)

    elif act == "Rejected":
        step.status = StepStatusEnum.REJECTED.value
        wf.status = WorkflowStatusEnum.REJECTED.value
        decision.status = DecisionStatusEnum.REJECTED.value

        # Mark subsequent steps as Skipped
        db.query(ApprovalStep).filter(
            ApprovalStep.workflow_id == workflow_id,
            ApprovalStep.step_number > step.step_number
        ).update({"status": StepStatusEnum.SKIPPED.value})

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action=AuditActionEnum.WORKFLOW_STEP_REJECTED.value,
            entity_type="ApprovalStep",
            entity_id=step.id,
            description=f"User '{current_user.full_name}' rejected Step {step.step_number} for decision #{decision.id}."
        )
        notif = Notification(
            recipient_id=decision.created_by,
            decision_id=decision.id,
            title="Decision Rejected",
            message=f"Your decision '{decision.title}' was rejected at Step {step.step_number}. Comments: {step.comments or 'None'}",
            notification_type=NotificationTypeEnum.DECISION_REJECTED.value
        )
        db.add(notif)

    db.commit()

    full_wf = db.query(ApprovalWorkflow).options(
        joinedload(ApprovalWorkflow.creator),
        joinedload(ApprovalWorkflow.steps).joinedload(ApprovalStep.reviewer)
    ).filter(ApprovalWorkflow.id == workflow_id).first()

    return _serialize_workflow(full_wf)


def escalate_workflow(db: Session, workflow_id: int, current_user: User) -> dict:
    wf = db.query(ApprovalWorkflow).options(
        joinedload(ApprovalWorkflow.steps).joinedload(ApprovalStep.reviewer),
        joinedload(ApprovalWorkflow.decision)
    ).filter(ApprovalWorkflow.id == workflow_id).first()

    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found.")

    now = datetime.now(timezone.utc)
    escalated_count = 0

    for s in wf.steps:
        if s.status == StepStatusEnum.PENDING.value and s.due_date:
            due = s.due_date
            is_overdue = (due < datetime.utcnow()) if due.tzinfo is None else (due < now)
            if is_overdue:
                escalated_count += 1
                # Dispatch notification to reviewer
                notif = Notification(
                    recipient_id=s.reviewer_id,
                    decision_id=wf.decision_id,
                    title="URGENT: Approval Step Overdue",
                    message=f"Step {s.step_number} for decision '{wf.decision.title}' is overdue! Please review immediately.",
                    notification_type=NotificationTypeEnum.DECISION_SUBMITTED.value
                )
                db.add(notif)

                create_audit_log(
                    db=db,
                    user_id=current_user.id,
                    action=AuditActionEnum.WORKFLOW_ESCALATED.value,
                    entity_type="ApprovalStep",
                    entity_id=s.id,
                    description=f"Step {s.step_number} of workflow #{wf.id} was escalated due to overdue status."
                )

    db.commit()
    return {
        "workflow_id": wf.id,
        "escalated_steps_count": escalated_count,
        "message": f"Successfully evaluated escalation: {escalated_count} overdue step(s) notified."
    }
