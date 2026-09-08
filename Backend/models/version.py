from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    change_summary = Column(String(255), nullable=True)
    snapshot = Column(Text, nullable=False)  # JSON string snapshot

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    decision = relationship("Decision", back_populates="versions")
    author = relationship("User", foreign_keys=[changed_by_id])
