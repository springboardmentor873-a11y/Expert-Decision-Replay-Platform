import enum
import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class RoleEnum(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    REVIEWER = "REVIEWER"
    MANAGER = "MANAGER"
    ADMINISTRATOR = "ADMINISTRATOR"


# Alias for backward compatibility in service imports
Role = RoleEnum


class DecisionStatus(str, enum.Enum):
    DRAFT = "Draft"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"


class CommentType(str, enum.Enum):
    GENERAL_COMMENT = "general_comment"
    MEETING_NOTE = "meeting_note"
    RATIONALE = "rationale"


def utc_now():
    return datetime.now(timezone.utc)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    users = relationship("User", back_populates="team", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.EMPLOYEE, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="users")
    decisions = relationship("Decision", back_populates="creator", cascade="all, delete-orphan")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    status = Column(SQLEnum(DecisionStatus), default=DecisionStatus.DRAFT, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    creator = relationship("User", back_populates="decisions")
    versions = relationship("DecisionVersion", back_populates="decision", cascade="all, delete-orphan", order_by="desc(DecisionVersion.version_number)")
    alternatives = relationship("Alternative", back_populates="decision", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="decision", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="decision", cascade="all, delete-orphan")


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    snapshot_data = Column(Text, nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    change_summary = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    decision = relationship("Decision", back_populates="versions")
    changed_by = relationship("User")

    @property
    def parsed_snapshot(self):
        if not self.snapshot_data:
            return {}
        try:
            return json.loads(self.snapshot_data) if isinstance(self.snapshot_data, str) else self.snapshot_data
        except Exception:
            return {}


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pros = Column(Text, nullable=True)  # JSON string array
    cons = Column(Text, nullable=True)  # JSON string array
    estimated_cost = Column(Float, default=0.0, nullable=True)
    feasibility_score = Column(Integer, default=5, nullable=True)
    risk_assessment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    decision = relationship("Decision", back_populates="alternatives")

    @property
    def parsed_pros(self):
        if not self.pros:
            return []
        try:
            return json.loads(self.pros) if isinstance(self.pros, str) else self.pros
        except Exception:
            return [self.pros]

    @property
    def parsed_cons(self):
        if not self.cons:
            return []
        try:
            return json.loads(self.cons) if isinstance(self.cons, str) else self.cons
        except Exception:
            return [self.cons]


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    comment_type = Column(SQLEnum(CommentType), default=CommentType.GENERAL_COMMENT, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    decision = relationship("Decision", back_populates="comments")
    author = relationship("User")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="SET NULL"), nullable=True)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    decision = relationship("Decision", back_populates="attachments")
    uploader = relationship("User")
    comment = relationship("Comment")
