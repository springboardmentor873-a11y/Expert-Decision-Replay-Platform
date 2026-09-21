from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from sqlalchemy import Numeric
from sqlalchemy import Boolean
from sqlalchemy import BigInteger
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


# ==========================================
# ROLE
# ==========================================

class Role(Base):

    __tablename__ = "roles"

    role_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    role_name = Column(
        String(100),
        nullable=False
    )

    users = relationship(
        "User",
        back_populates="role"
    )


# ==========================================
# TEAM
# ==========================================

class Team(Base):

    __tablename__ = "teams"

    team_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    team_name = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    is_archived = Column(
        Boolean,
        nullable=False,
        default=False
    )

    manager_user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    manager = relationship(
        "User",
        foreign_keys=[manager_user_id],
        post_update=True
    )

    users = relationship(
        "User",
        back_populates="team",
        foreign_keys="User.team_id"
    )

    requests = relationship(
        "TeamRequest",
        back_populates="team",
        cascade="all, delete-orphan"
    )


# ==========================================
# TEAM JOIN REQUEST
# ==========================================

class TeamRequest(Base):

    __tablename__ = "team_requests"

    request_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    team_id = Column(
        Integer,
        ForeignKey("teams.team_id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False,
        default="Pending"
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    team = relationship(
        "Team",
        back_populates="requests"
    )

    user = relationship(
        "User",
        foreign_keys=[user_id]
    )


# ==========================================
# USER
# ==========================================

class User(Base):

    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role_id = Column(
        Integer,
        ForeignKey("roles.role_id"),
        nullable=False
    )

    team_id = Column(
        Integer,
        ForeignKey("teams.team_id"),
        nullable=False
    )

    role = relationship(
        "Role",
        back_populates="users"
    )

    team = relationship(
        "Team",
        back_populates="users",
        foreign_keys="User.team_id"
    )

    decisions = relationship(
        "Decision",
        foreign_keys="Decision.expert_id",
        back_populates="expert"
    )


# ==========================================
# DECISION
# ==========================================

class Decision(Base):

    __tablename__ = "decisions"

    decision_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    expert_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text
    )

    decision_context = Column(
        Text
    )

    decision_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    status = Column(
        String(50),
        nullable=False,
        default="Draft"
    )

    problem_statement = Column(
        Text
    )

    objective = Column(
        Text
    )

    evaluation_criteria = Column(
        Text
    )

    risks = Column(
        Text
    )

    stakeholders = Column(
        Text
    )

    implementation_status = Column(
        String(50),
        nullable=False,
        default="Not Started"
    )

    rationale = Column(
        Text
    )

    final_outcome = Column(
        Text
    )

    priority = Column(
        String(50),
        nullable=False,
        default="Medium"
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.user_id")
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.category_id")
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    expert = relationship(
        "User",
        foreign_keys=[expert_id],
        back_populates="decisions"
    )

    assigned = relationship(
        "User",
        foreign_keys=[assigned_to]
    )

    alternatives = relationship(
        "DecisionAlternative",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    versions = relationship(
        "DecisionVersion",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    documents = relationship(
        "DecisionDocument",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    comments = relationship(
        "DecisionComment",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    approvals = relationship(
        "DecisionApproval",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    notifications = relationship(
        "Notification",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="decision",
        cascade="all, delete-orphan"
    )

    category = relationship(
        "Category",
        back_populates="decisions"
    )


# ==========================================
# CATEGORY
# ==========================================

class Category(Base):

    __tablename__ = "categories"

    category_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    category_name = Column(
        String(100),
        nullable=False,
        unique=True
    )

    decisions = relationship(
        "Decision",
        back_populates="category"
    )


# ==========================================
# DECISION ALTERNATIVE
# ==========================================

class DecisionAlternative(Base):

    __tablename__ = "decision_alternatives"

    alternative_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text
    )

    pros = Column(
        Text
    )

    cons = Column(
        Text
    )

    estimated_cost = Column(
        Numeric(12, 2)
    )

    feasibility = Column(
        String(50)
    )

    risk_level = Column(
        String(50)
    )

    risk_explanation = Column(
        Text
    )

    is_recommended = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    created_at = Column(
        DateTime
    )

    updated_at = Column(
        DateTime
    )

    decision = relationship(
        "Decision",
        back_populates="alternatives"
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by]
    )


# ==========================================
# DECISION VERSION
# ==========================================

class DecisionVersion(Base):

    __tablename__ = "decision_versions"

    version_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=False
    )

    version_number = Column(
        Integer,
        nullable=False
    )

    title = Column(
        String(200)
    )

    description = Column(
        Text
    )

    decision_context = Column(
        Text
    )

    problem_statement = Column(
        Text
    )

    objective = Column(
        Text
    )

    evaluation_criteria = Column(
        Text
    )

    risks = Column(
        Text
    )

    stakeholders = Column(
        Text
    )

    implementation_status = Column(
        String(50)
    )

    rationale = Column(
        Text
    )

    final_outcome = Column(
        Text
    )

    status = Column(
        String(50)
    )

    priority = Column(
        String(50)
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.category_id")
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    changed_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    change_summary = Column(
        Text
    )

    decision = relationship(
        "Decision",
        back_populates="versions"
    )

    changer = relationship(
        "User",
        foreign_keys=[changed_by]
    )


# ==========================================
# DECISION DOCUMENT
# ==========================================

class DecisionDocument(Base):

    __tablename__ = "decision_documents"

    document_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=False
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    original_file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_type = Column(
        String(100)
    )

    file_size = Column(
        BigInteger
    )

    uploaded_at = Column(
        DateTime
    )

    decision = relationship(
        "Decision",
        back_populates="documents"
    )

    uploader = relationship(
        "User",
        foreign_keys=[uploaded_by]
    )


# ==========================================
# DECISION APPROVAL (APPROVAL WORKFLOW)
# ==========================================

class DecisionApproval(Base):

    __tablename__ = "decision_approvals"

    approval_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=False
    )

    action = Column(
        String(100),
        nullable=False
    )

    role_id = Column(
        Integer,
        ForeignKey("roles.role_id")
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id")
    )

    reason = Column(
        Text
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    decision = relationship(
        "Decision",
        back_populates="approvals"
    )

    user = relationship(
        "User",
        foreign_keys=[user_id]
    )

    role = relationship(
        "Role",
        foreign_keys=[role_id]
    )


# ==========================================
# DECISION COMMENT (DISCUSSION)
# ==========================================

class DecisionComment(Base):

    __tablename__ = "decision_comments"

    comment_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    decision = relationship(
        "Decision",
        back_populates="comments"
    )

    author = relationship(
        "User",
        foreign_keys=[user_id]
    )


# ==========================================
# NOTIFICATION
# ==========================================

class Notification(Base):

    __tablename__ = "notifications"

    notification_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    type = Column(
        String(100),
        nullable=False
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=True
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        foreign_keys=[user_id]
    )

    decision = relationship(
        "Decision",
        foreign_keys=[decision_id],
        back_populates="notifications"
    )


# ==========================================
# AUDIT LOG
# ==========================================

class AuditLog(Base):

    __tablename__ = "audit_logs"

    log_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    action = Column(
        String(255),
        nullable=False
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=True
    )

    old_value = Column(
        Text
    )

    new_value = Column(
        Text
    )

    description = Column(
        Text
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    entity_type = Column(
        String(100)
    )

    entity_id = Column(
        Integer
    )

    user = relationship(
        "User",
        foreign_keys=[user_id]
    )

    decision = relationship(
        "Decision",
        foreign_keys=[decision_id],
        back_populates="audit_logs"
    )


# ==========================================
# KNOWLEDGE ARTICLE
# ==========================================

class KnowledgeArticle(Base):

    __tablename__ = "knowledge_articles"

    article_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False,
        default="General"
    )

    author_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    author = relationship(
        "User",
        foreign_keys=[author_id]
    )


# ==========================================
# TEAM MEETING
# ==========================================

class Meeting(Base):

    __tablename__ = "meetings"

    meeting_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    team_id = Column(
        Integer,
        ForeignKey("teams.team_id"),
        nullable=True
    )

    organizer_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True
    )

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id"),
        nullable=True
    )

    scheduled_at = Column(
        DateTime,
        nullable=False
    )

    duration_minutes = Column(
        Integer,
        nullable=True,
        default=30
    )

    location = Column(
        String(200),
        nullable=True
    )

    agenda = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Scheduled"
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    team = relationship(
        "Team",
        foreign_keys=[team_id]
    )

    organizer = relationship(
        "User",
        foreign_keys=[organizer_id]
    )

    decision = relationship(
        "Decision",
        foreign_keys=[decision_id]
    )