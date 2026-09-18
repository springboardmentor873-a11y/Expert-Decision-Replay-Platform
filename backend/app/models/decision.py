from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class DecisionStatusEnum(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    context = Column(Text, nullable=False)
    decision_taken = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=True)
    actual_outcome = Column(Text, nullable=True)
    status = Column(
        String(50),
        default=DecisionStatusEnum.DRAFT.value,
        nullable=False,
        index=True
    )
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
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
    creator = relationship("User", back_populates="decisions")
    alternatives = relationship(
        "Alternative",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="Alternative.id"
    )
    documents = relationship(
        "Document",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="Document.id"
    )
    discussions = relationship(
        "Discussion",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="Discussion.created_at.asc()"
    )
    versions = relationship(
        "DecisionVersion",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="DecisionVersion.version_number.desc()"
    )
    approvals = relationship(
        "Approval",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="Approval.created_at.desc()"
    )
    notifications = relationship(
        "Notification",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="Notification.created_at.desc()"
    )
    category = relationship("Category", back_populates="decisions")
    team = relationship("Team", back_populates="decisions")
    meeting_notes = relationship(
        "MeetingNote",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="MeetingNote.created_at.desc()"
    )
    approval_workflows = relationship(
        "ApprovalWorkflow",
        back_populates="decision",
        cascade="all, delete-orphan",
        order_by="ApprovalWorkflow.created_at.desc()"
    )
    tags = relationship(
        "DecisionTag",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Decision(id={self.id}, title='{self.title}', status='{self.status}', created_by={self.created_by})>"