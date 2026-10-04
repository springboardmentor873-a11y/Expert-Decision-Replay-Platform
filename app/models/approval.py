from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    reviewer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    approval_level = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="Pending"
    )

    assigned_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    due_date = Column(
        DateTime(timezone=True),
        nullable=True
    )

    reminder_sent_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # If this approval exists because a prior pending approval was
    # escalated (e.g. the original reviewer was unavailable), this
    # points back to that original Approval row.
    escalated_from_id = Column(
        Integer,
        ForeignKey("approvals.id"),
        nullable=True
    )

    decision = relationship(
        "Decision",
        back_populates="approvals"
    )

    reviewer = relationship(
        "User",
        back_populates="approvals"
    )