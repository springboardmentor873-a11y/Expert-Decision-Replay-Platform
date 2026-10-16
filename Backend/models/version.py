from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from database.database import Base


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    version = Column(Integer, nullable=False)

    title = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    status = Column(String, nullable=False)
    rationale = Column(Text, nullable=True)
    change_summary = Column(Text, nullable=True)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    decision = relationship("Decision", back_populates="versions")
