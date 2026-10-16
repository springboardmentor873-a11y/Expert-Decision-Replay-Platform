import enum

from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from database.database import Base


class ApprovalStepStatus(str, enum.Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"
    skipped = "Skipped"  # left pending when an earlier step rejects


class ApprovalStep(Base):
    """One level in a decision's approval chain.

    A decision's approval workflow is a sequence of steps ordered by
    `level` (1, 2, 3, ...), each assigned to one reviewer. A step only
    becomes actionable once every lower-level step has been approved —
    enforced in the router, not here. Rejecting any step immediately
    rejects the whole decision and skips the remaining steps.
    """

    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False, index=True)
    level = Column(Integer, nullable=False)  # 1-based order within the decision
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(Enum(ApprovalStepStatus), default=ApprovalStepStatus.pending, nullable=False)
    comment = Column(Text, nullable=True)

    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)

    decision = relationship("Decision", backref="approval_steps")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
