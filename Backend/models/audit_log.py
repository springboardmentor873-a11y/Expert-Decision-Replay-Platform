from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True, index=True)
    action = Column(String(80), nullable=False, index=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    actor = relationship("User")
    decision = relationship("Decision")
