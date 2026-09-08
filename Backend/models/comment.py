from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from datetime import datetime
from database.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)

    content = Column(Text, nullable=False)
    is_meeting_note = Column(Boolean, default=False)
    meeting_date = Column(DateTime, nullable=True)
    meeting_attendees = Column(String(255), nullable=True)
    attachment_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", foreign_keys=[user_id])
    decision = relationship("Decision", back_populates="comments")
    replies = relationship(
        "Comment",
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
        single_parent=True
    )
