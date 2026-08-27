import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Enum, Text, Table, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    EMPLOYEE = "employee"
    REVIEWER = "reviewer"
    MANAGER = "manager"
    ADMINISTRATOR = "administrator"


# Association table: users <-> teams (many-to-many, a user can belong to multiple teams)
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", UUID(as_uuid=False), ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        Enum(
            RoleEnum,
            name="role_enum",
            values_callable=lambda role_enum: [role.value for role in role_enum],
        ),
        nullable=False,
        default=RoleEnum.EMPLOYEE,
    )
    job_title = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    teams = relationship("Team", secondary=team_members, back_populates="members")
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id")

    __table_args__ = (
        Index("ix_users_role", "role"),
        Index("ix_users_is_active", "is_active"),
    )


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(150), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    manager_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    members = relationship("User", secondary=team_members, back_populates="teams")
    manager = relationship("User", foreign_keys=[manager_id])


class AuditLog(Base):
    """
    Foundational audit log table (Milestone 1 scope: auth + user-management events only;
    decision-level audit trail is extended in a future milestone covering Decisions,
    Evidence, Reviews, Approvals and Replay).
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    actor_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(150), nullable=False, index=True)  # e.g. "login", "user_registered", "role_changed"
    details = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])
