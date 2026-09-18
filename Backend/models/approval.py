from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    # stage: 1 = Reviewer Review, 2 = Manager Approval
    stage = Column(Integer, default=1, nullable=False)
    # status: "Pending", "Approved", "Rejected", "Changes Requested"
    status = Column(String(50), default="Pending", nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    is_escalated = Column(Boolean, default=False, nullable=False)
    escalated_at = Column(DateTime, nullable=True)
    escalation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    decision = relationship("Decision", backref="approval_workflows")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    assigned_role = relationship("Role", foreign_keys=[assigned_role_id])
    actions = relationship("ApprovalAction", back_populates="workflow", cascade="all, delete-orphan", order_by="ApprovalAction.created_at.desc()")


class ApprovalAction(Base):
    __tablename__ = "approval_actions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("approval_workflows.id", ondelete="CASCADE"), nullable=False)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stage = Column(Integer, nullable=False)
    # action: "Submitted", "Approved", "Rejected", "Changes Requested", "Escalated", "Reassigned"
    action = Column(String(50), nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="actions")
    decision = relationship("Decision")
    user = relationship("User")
