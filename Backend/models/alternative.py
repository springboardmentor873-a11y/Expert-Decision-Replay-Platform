from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


class DecisionAlternative(Base):
    __tablename__ = "decision_alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pros = Column(Text, nullable=True)  # JSON string list
    cons = Column(Text, nullable=True)  # JSON string list
    cost_estimate = Column(String(100), nullable=True)
    feasibility_analysis = Column(Text, nullable=True)
    feasibility_score = Column(Integer, nullable=True, default=5)  # 1-10
    risk_assessment = Column(Text, nullable=True)
    risk_level = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    mitigation_plan = Column(Text, nullable=True)
    is_selected = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    decision = relationship("Decision", back_populates="alternatives")
