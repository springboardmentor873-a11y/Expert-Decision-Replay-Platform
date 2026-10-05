from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    recipient = relationship("User")
    decision = relationship("Decision")
