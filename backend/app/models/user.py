from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to Role model (Many Users to 1 Role)
    role = relationship("Role", back_populates="users")

    # Relationship to Decision model (1 User to Many Decisions)
    decisions = relationship("Decision", back_populates="creator", cascade="all, delete-orphan")

    # Relationship to Document model (1 User to Many Uploaded Documents)
    documents = relationship("Document", back_populates="uploader")

    # Relationship to Discussion model (1 User to Many Discussions)
    discussions = relationship("Discussion", back_populates="user")

    # Relationship to DecisionVersion model (1 User to Many Decision Versions)
    decision_versions = relationship("DecisionVersion", back_populates="changer")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role_id={self.role_id})>"