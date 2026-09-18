from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    # action_category: "Activity", "Security", "Access", "Decision", "Approval", "Export"
    action_category = Column(String(50), default="Activity", nullable=False, index=True)
    # action: e.g. "LOGIN_SUCCESS", "DECISION_CREATED", "STAGE1_APPROVED", "DECISION_ESCALATED"
    action = Column(String(100), nullable=False, index=True)
    # entity_type: "Decision", "Alternative", "User", "Approval", "Document", "Report", "Session"
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", backref="audit_logs")
