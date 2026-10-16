from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role", back_populates="users")
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    profile = relationship("UserProfile", back_populates="user", uselist=False)

    decisions = relationship("Decision", back_populates="creator", foreign_keys="Decision.created_by_id")
    comments = relationship("Comment", back_populates="user")
    attachments = relationship("Attachment", back_populates="uploaded_by")


class UserProfile(Base):
    """Additional per-user info, kept separate from the core `users` table
    so the login/auth path never has to touch these optional fields."""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)  # stored as a file path/URL

    user = relationship("User", back_populates="profile")
