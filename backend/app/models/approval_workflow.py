from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class WorkflowStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class StepStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    SKIPPED = "Skipped"


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name = Column(String(255), nullable=False, default="Decision Approval Workflow")
    status = Column(
        String(50),
        default=WorkflowStatusEnum.PENDING.value,
        nullable=False,
        index=True
    )
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    decision = relationship("Decision", back_populates="approval_workflows")
    creator = relationship("User", backref="created_workflows")
    steps = relationship(
        "ApprovalStep",
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="ApprovalStep.step_number.asc()"
    )

    def __repr__(self):
        return f"<ApprovalWorkflow(id={self.id}, decision_id={self.decision_id}, status='{self.status}')>"


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workflow_id = Column(
        Integer,
        ForeignKey("approval_workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    step_number = Column(Integer, nullable=False)
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    status = Column(
        String(50),
        default=StepStatusEnum.PENDING.value,
        nullable=False,
        index=True
    )
    comments = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="steps")
    reviewer = relationship("User", backref="approval_steps")

    def __repr__(self):
        return f"<ApprovalStep(id={self.id}, workflow_id={self.workflow_id}, step={self.step_number}, status='{self.status}')>"
