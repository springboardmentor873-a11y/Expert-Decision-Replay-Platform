from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class ApprovalActionEnum(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    action = Column(String(50), nullable=False)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    rejection_reason = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    decision = relationship("Decision", back_populates="approvals")
    reviewer = relationship("User", back_populates="approvals")

    def __repr__(self):
        return (
            f"<Approval(id={self.id}, decision_id={self.decision_id}, "
            f"reviewer_id={self.reviewer_id}, action='{self.action}', new_status='{self.new_status}')>"
        )
