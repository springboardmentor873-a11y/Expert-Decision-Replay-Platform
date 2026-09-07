from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    parent_id = Column(
        Integer,
        ForeignKey("discussions.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    decision = relationship("Decision", back_populates="discussions")
    user = relationship("User", back_populates="discussions")
    parent = relationship("Discussion", remote_side=[id], back_populates="replies")
    replies = relationship(
        "Discussion",
        back_populates="parent",
        cascade="all, delete-orphan",
        order_by="Discussion.created_at.asc()"
    )

    def __repr__(self):
        return f"<Discussion(id={self.id}, decision_id={self.decision_id}, user_id={self.user_id}, parent_id={self.parent_id})>"
