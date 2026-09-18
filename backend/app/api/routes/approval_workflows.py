from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.approval_workflow import (
    ApprovalStepActionRequest,
    ApprovalWorkflowCreateRequest,
    ApprovalWorkflowResponse,
)
from app.core.dependencies import get_current_user
from app.services.approval_workflow_service import (
    act_on_step,
    create_approval_workflow,
    escalate_workflow,
    get_workflows_for_decision,
)

router = APIRouter(tags=["Approval Workflows"])


@router.get("/decisions/{decision_id}/workflows", response_model=List[ApprovalWorkflowResponse])
def list_decision_workflows(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all approval workflows and steps for a decision."""
    return get_workflows_for_decision(db, decision_id)


@router.post("/decisions/{decision_id}/workflows", response_model=ApprovalWorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_new_workflow(
    decision_id: int,
    workflow_in: ApprovalWorkflowCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new multi-level approval workflow with sequential steps."""
    return create_approval_workflow(db, decision_id, workflow_in, current_user)


@router.post("/approval-workflows/{workflow_id}/steps/{step_id}/action", response_model=ApprovalWorkflowResponse)
def execute_step_action(
    workflow_id: int,
    step_id: int,
    action_in: ApprovalStepActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve or Reject a sequential workflow step."""
    return act_on_step(db, workflow_id, step_id, action_in, current_user)


@router.post("/approval-workflows/{workflow_id}/escalate")
def trigger_workflow_escalation(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluate and notify overdue steps in a workflow."""
    return escalate_workflow(db, workflow_id, current_user)

