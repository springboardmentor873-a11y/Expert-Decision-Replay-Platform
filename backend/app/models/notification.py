from datetime import datetime, timezone
import enum
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class NotificationTypeEnum(str, enum.Enum):
    DECISION_SUBMITTED = "DECISION_SUBMITTED"
    DECISION_APPROVED = "DECISION_APPROVED"
    DECISION_REJECTED = "DECISION_REJECTED"
    DISCUSSION_CREATED = "DISCUSSION_CREATED"
    DISCUSSION_REPLY = "DISCUSSION_REPLY"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DECISION_UPDATED = "DECISION_UPDATED"
    TEAM_JOIN_REQUESTED = "TEAM_JOIN_REQUESTED"
    TEAM_JOIN_APPROVED = "TEAM_JOIN_APPROVED"
    TEAM_JOIN_REJECTED = "TEAM_JOIN_REJECTED"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recipient_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    notification_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    recipient = relationship("User", back_populates="notifications")
    decision = relationship("Decision", back_populates="notifications")

    def __repr__(self):
        return (
            f"<Notification(id={self.id}, recipient_id={self.recipient_id}, "
            f"type='{self.notification_type}', is_read={self.is_read})>"
        )
