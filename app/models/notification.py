from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # Who this notification is for.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    notification_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    # Optional link back to the thing this notification is about
    # (e.g. entity_type="Decision", entity_id=42).
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)

    is_read = Column(Boolean, nullable=False, default=False)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="notifications")
