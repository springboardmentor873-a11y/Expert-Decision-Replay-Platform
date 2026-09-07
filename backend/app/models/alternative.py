from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    pros = Column(Text, nullable=False)
    cons = Column(Text, nullable=False)
    cost = Column(String(100), nullable=True)
    feasibility = Column(String(50), nullable=True)
    risk_assessment = Column(Text, nullable=True)
    is_selected = Column(Boolean, default=False, nullable=False)

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
    decision = relationship("Decision", back_populates="alternatives")

    def __repr__(self):
        return f"<Alternative(id={self.id}, name='{self.name}', decision_id={self.decision_id}, is_selected={self.is_selected})>"