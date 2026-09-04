from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    name = Column(String(255), nullable=False)

    description = Column(Text, nullable=True)

    pros = Column(Text, nullable=True)

    cons = Column(Text, nullable=True)

    cost = Column(Float, nullable=True)

    feasibility = Column(
        String(100),
        nullable=True
    )

    risk = Column(
        String(100),
        nullable=True
    )

    decision = relationship(
        "Decision",
        back_populates="alternatives"
    )