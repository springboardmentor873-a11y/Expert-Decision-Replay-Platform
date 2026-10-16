from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from database.database import Base


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)

    title = Column(String, nullable=False)
    pros = Column(Text, nullable=True)
    cons = Column(Text, nullable=True)
    estimated_cost = Column(Float, nullable=True)  # e.g. in your currency of choice
    risk_score = Column(Float, default=0.0)  # 0 (low risk) - 10 (high risk)
    feasibility_score = Column(Float, default=0.0)  # 0 - 10, higher is more feasible
    is_recommended = Column(Integer, default=0)  # 1 if auto-recommended, else 0

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    decision = relationship("Decision", back_populates="alternatives")

    @property
    def composite_score(self) -> float:
        """
        Simple composite score: higher feasibility and lower risk/cost is better.
        Feel free to tune these weights to match your evaluation criteria.
        """
        cost_penalty = (self.estimated_cost or 0) / 1000.0  # scale cost down
        return round((self.feasibility_score or 0) - (self.risk_score or 0) - cost_penalty, 2)
