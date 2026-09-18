from sqlalchemy import Column, Integer, String, Enum, Boolean, ForeignKey, Text, DateTime, Table
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class RoleEnum(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    REVIEWER = "REVIEWER"
    MANAGER = "MANAGER"
    ADMINISTRATOR = "ADMINISTRATOR"

class DecisionStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"

class ApprovalStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

team_members = Table(
    "team_members",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("team_id", Integer, ForeignKey("teams.id"))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True)

    decisions = relationship("Decision", back_populates="creator")
    discussions = relationship("Discussion", back_populates="user")
    documents = relationship("Document", back_populates="uploaded_by")
    teams = relationship("Team", secondary=team_members, back_populates="members")
    approvals = relationship("Approval", back_populates="reviewer")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("User", secondary=team_members, back_populates="teams")
    decisions = relationship("Decision", back_populates="team")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    category = Column(String, index=True)
    status = Column(Enum(DecisionStatusEnum), default=DecisionStatusEnum.DRAFT)
    version = Column(Integer, default=1)
    creator_id = Column(Integer, ForeignKey("users.id"))
    team_id = Column(Integer, ForeignKey("teams.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="decisions")
    team = relationship("Team", back_populates="decisions")
    alternatives = relationship("Alternative", back_populates="decision", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="decision", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="decision", cascade="all, delete-orphan")
    versions = relationship("DecisionVersion", back_populates="decision", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="decision", cascade="all, delete-orphan")

class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    description = Column(Text, nullable=False)
    pros = Column(Text)
    cons = Column(Text)
    cost = Column(String)
    feasibility = Column(String)
    risk = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="alternatives")

class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="discussions")
    user = relationship("User", back_populates="discussions")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="documents")
    uploaded_by = relationship("User", back_populates="documents")

class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    version = Column(Integer, nullable=False)
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    status = Column(Enum(DecisionStatusEnum))
    changed_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="versions")
    changed_by = relationship("User")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.PENDING)
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    decision = relationship("Decision", back_populates="approvals")
    reviewer = relationship("User", back_populates="approvals")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    related_entity_type = Column(String)
    related_entity_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String)
    entity_id = Column(Integer)
    description = Column(Text)
    ip_address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
