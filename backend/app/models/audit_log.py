from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.database.database import Base


class AuditActionEnum(str, enum.Enum):
    # Authentication & User lifecycle
    USER_REGISTERED = "USER_REGISTERED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"

    # Decision lifecycle
    DECISION_CREATED = "DECISION_CREATED"
    DECISION_UPDATED = "DECISION_UPDATED"
    DECISION_SUBMITTED = "DECISION_SUBMITTED"
    DECISION_DELETED = "DECISION_DELETED"

    # Alternatives
    ALTERNATIVE_CREATED = "ALTERNATIVE_CREATED"
    ALTERNATIVE_UPDATED = "ALTERNATIVE_UPDATED"
    ALTERNATIVE_DELETED = "ALTERNATIVE_DELETED"

    # Documents
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_DELETED = "DOCUMENT_DELETED"

    # Discussions
    DISCUSSION_CREATED = "DISCUSSION_CREATED"
    DISCUSSION_UPDATED = "DISCUSSION_UPDATED"
    DISCUSSION_DELETED = "DISCUSSION_DELETED"
    DISCUSSION_REPLY_CREATED = "DISCUSSION_REPLY_CREATED"

    # Approvals
    DECISION_APPROVED = "DECISION_APPROVED"
    DECISION_REJECTED = "DECISION_REJECTED"

    # Version Tracking
    VERSION_CREATED = "VERSION_CREATED"

    # Notifications
    NOTIFICATION_CREATED = "NOTIFICATION_CREATED"
    NOTIFICATION_READ = "NOTIFICATION_READ"

    # Teams
    TEAM_CREATED = "TEAM_CREATED"
    TEAM_UPDATED = "TEAM_UPDATED"
    TEAM_DELETED = "TEAM_DELETED"
    TEAM_MEMBER_ADDED = "TEAM_MEMBER_ADDED"
    TEAM_MEMBER_REMOVED = "TEAM_MEMBER_REMOVED"

    # User Settings & Security
    USER_PROFILE_UPDATED = "USER_PROFILE_UPDATED"
    USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED"

    # Decisions (Archival)
    DECISION_ARCHIVED = "DECISION_ARCHIVED"
    DECISION_UNARCHIVED = "DECISION_UNARCHIVED"

    # Categories
    CATEGORY_CREATED = "CATEGORY_CREATED"
    CATEGORY_UPDATED = "CATEGORY_UPDATED"
    CATEGORY_DELETED = "CATEGORY_DELETED"

    # Meeting Notes
    MEETING_NOTE_CREATED = "MEETING_NOTE_CREATED"
    MEETING_NOTE_UPDATED = "MEETING_NOTE_UPDATED"
    MEETING_NOTE_DELETED = "MEETING_NOTE_DELETED"

    # Workflows & Steps
    WORKFLOW_CREATED = "WORKFLOW_CREATED"
    WORKFLOW_STEP_APPROVED = "WORKFLOW_STEP_APPROVED"
    WORKFLOW_STEP_REJECTED = "WORKFLOW_STEP_REJECTED"
    WORKFLOW_ESCALATED = "WORKFLOW_ESCALATED"

    # Tags
    TAG_CREATED = "TAG_CREATED"
    TAG_ASSIGNED = "TAG_ASSIGNED"
    TAG_REMOVED = "TAG_REMOVED"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True, index=True)
    description = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', entity='{self.entity_type}:{self.entity_id}', user_id={self.user_id})>"
