from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
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

    users = relationship(
        "User",
        back_populates="team"
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
        back_populates="users"
    )