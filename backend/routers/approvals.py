from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models, schemas, database, auth
from .audit_logs import log_action
from .notifications import create_notification

router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"]
)

@router.post("/", response_model=schemas.ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval_request(
    decision_id: int, 
    reviewer_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    decision = db.query(models.Decision).filter(models.Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    reviewer = db.query(models.User).filter(models.User.id == reviewer_id).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer not found")

    # Change decision status
    decision.status = models.DecisionStatusEnum.UNDER_REVIEW

    approval = models.Approval(
        decision_id=decision_id,
        reviewer_id=reviewer_id,
        status=models.ApprovalStatusEnum.PENDING
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    # Log action
    log_action(db, current_user.id, "Requested Approval", "Decision", decision_id, f"Requested review from {reviewer.full_name}")

    # Notify Reviewer
    create_notification(db, reviewer_id, f"You have been requested to review the decision: '{decision.title}'", "Decision", decision_id)

    return approval

@router.put("/{approval_id}", response_model=schemas.ApprovalResponse)
def update_approval_status(
    approval_id: int, 
    approval_update: schemas.ApprovalBase, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    if approval.reviewer_id != current_user.id and current_user.role != models.RoleEnum.ADMINISTRATOR:
        raise HTTPException(status_code=403, detail="Not authorized to update this approval")

    approval.status = approval_update.status
    if approval_update.comments:
        approval.comments = approval_update.comments
    approval.updated_at = datetime.utcnow()

    decision = db.query(models.Decision).filter(models.Decision.id == approval.decision_id).first()
    
    # Update decision status based on approval
    if approval.status == models.ApprovalStatusEnum.APPROVED:
        decision.status = models.DecisionStatusEnum.APPROVED
        action_text = "Approved Decision"
    elif approval.status == models.ApprovalStatusEnum.REJECTED:
        decision.status = models.DecisionStatusEnum.REJECTED
        action_text = "Rejected Decision"
    else:
        action_text = "Updated Approval Status to Pending"

    db.commit()
    db.refresh(approval)

    # Log action
    log_action(db, current_user.id, action_text, "Decision", decision.id, f"Reviewer comments: {approval.comments}")

    # Notify Creator
    if decision.creator_id != current_user.id:
        create_notification(db, decision.creator_id, f"Your decision '{decision.title}' was {approval.status.value.lower()}.", "Decision", decision.id)

    return approval
