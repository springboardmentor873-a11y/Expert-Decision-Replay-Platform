from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text,  Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    users = relationship("User", back_populates="team")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    role = relationship("Role", back_populates="users")
    @property
    def role_name(self):
        return self.role.name if self.role else None
    team = relationship("Team", back_populates="users")

    decisions = relationship(
        "Decision",
        back_populates="owner"
    )
    discussions = relationship(
    "Discussion",
    back_populates="user"
    )
    approvals = relationship(
        "Approval",
        back_populates="reviewer"
    )
    notifications = relationship(
    "Notification",
    back_populates="user",
    cascade="all, delete-orphan"
)



class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(
        String(50),
        nullable=False,
        default="Draft"
    )

    priority = Column(
        String(50),
        nullable=False,
        default="Medium"
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    owner = relationship(
        "User",
        back_populates="decisions"
    )

    alternatives = relationship(
        "Alternative",
        back_populates="decision",
        cascade="all, delete-orphan"
    )
    files = relationship(
    "DecisionFile",
    back_populates="decision",
    cascade="all, delete-orphan"
    )
    discussions = relationship(
    "Discussion",
    back_populates="decision",
    cascade="all, delete-orphan"
    )
    approvals = relationship(
    "Approval", 
    back_populates="decision", 
    cascade="all, delete-orphan"
    )
    versions = relationship(
    "DecisionVersion",
    back_populates="decision",
    cascade="all, delete-orphan"
)




class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    name = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    pros = Column(
        Text,
        nullable=True
    )

    cons = Column(
        Text,
        nullable=True
    )

    decision = relationship(
        "Decision",
        back_populates="alternatives"
    )

class DecisionFile(Base):
    __tablename__ = "decision_files"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_type = Column(
        String(100),
        nullable=True
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    decision = relationship(
        "Decision",
        back_populates="files"
    )

class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    version_number = Column(
        Integer,
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False
    )

    priority = Column(
        String(50),
        nullable=False
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    decision = relationship(
        "Decision",
        back_populates="versions"
    )


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    comment = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    decision = relationship(
        "Decision",
        back_populates="discussions"
    )

    user = relationship(
        "User",
        back_populates="discussions"
    )

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
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Pending"
    )

    comments = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    reviewed_at = Column(
        DateTime(timezone=True),
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

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    message = Column(
        String(500),
        nullable=False
    )

    notification_type = Column(
        String(50),
        nullable=False,
        default="General"
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="notifications"
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User")