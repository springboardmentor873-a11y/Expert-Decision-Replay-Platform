from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


def utcnow() -> datetime:
    """Timezone-aware UTC timestamp used as the default for every table."""

    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="employee")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    decisions = relationship(
        "Decision",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    documents = relationship(
        "Document",
        back_populates="uploader",
        foreign_keys="Document.uploaded_by",
    )

    comments = relationship("Comment", back_populates="user")

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Milestone 3: Approval workflow
    approval_requests = relationship(
        "Approval",
        foreign_keys="Approval.requested_by",
        back_populates="requester",
    )

    approvals_reviewed = relationship(
        "Approval",
        foreign_keys="Approval.reviewed_by",
        back_populates="reviewer",
    )


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    problem = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    final_decision = Column(Text, nullable=True)
    status = Column(String(50), default="Draft", nullable=False, index=True)
    category = Column(String(100), nullable=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    user = relationship("User", back_populates="decisions")
    alternatives = relationship(
        "Alternative", back_populates="decision", cascade="all, delete-orphan"
    )
    reviews = relationship(
        "Review", back_populates="decision", cascade="all, delete-orphan"
    )
    history = relationship(
        "DecisionHistory", back_populates="decision", cascade="all, delete-orphan"
    )
    outcome = relationship(
        "Outcome", back_populates="decision", uselist=False, cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document", back_populates="decision", cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", back_populates="decision", cascade="all, delete-orphan"
    )

    # Milestone 3: Approval workflow
    approvals = relationship(
        "Approval",
        back_populates="decision",
        cascade="all, delete-orphan",
    )


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )

    decision = relationship("Decision", back_populates="alternatives")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    comment = Column(Text, nullable=False)
    status = Column(String(50), default="Pending")
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    decision = relationship("Decision", back_populates="reviews")


class DecisionHistory(Base):
    __tablename__ = "decision_history"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    description = Column(Text)
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    changed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    decision = relationship("Decision", back_populates="history")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, index=True)
    expected_outcome = Column(Text)
    actual_outcome = Column(Text)
    result = Column(String(100))
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    decision = relationship("Decision", back_populates="outcome")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    # Path relative to the configured upload root. Absolute paths from older
    # releases are still supported at read time.
    filepath = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    content_type = Column(String(150), nullable=True)
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    decision = relationship("Decision", back_populates="documents")
    uploader = relationship("User", back_populates="documents", foreign_keys=[uploaded_by])


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    is_meeting_note = Column(Boolean, default=False, nullable=False)
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    decision = relationship("Decision", back_populates="comments")
    user = relationship("User", back_populates="comments")


# ============================================================
# MILESTONE 3 - APPROVAL WORKFLOW
# ============================================================

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    requested_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    status = Column(String(50), nullable=False, default="Pending", index=True)

    comments = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    decision = relationship("Decision", back_populates="approvals")

    requester = relationship(
        "User",
        foreign_keys=[requested_by],
        back_populates="approval_requests",
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
        back_populates="approvals_reviewed",
    )


# ============================================================
# MILESTONE 3 - NOTIFICATIONS
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    title = Column(String(200), nullable=False)

    message = Column(Text, nullable=False)

    notification_type = Column(String(50), default="info", nullable=False)

    is_read = Column(Boolean, default=False, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    user = relationship("User", back_populates="notifications")


# ============================================================
# MILESTONE 3 - AUDIT LOGS
# ============================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_name = Column(String(100), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    # Kept when the decision is deleted so the audit trail survives.
    decision_id = Column(
        Integer, ForeignKey("decisions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)