from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.database import Base


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    decision_id = Column(
        Integer,
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    version_number = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    context = Column(Text, nullable=False)
    decision_taken = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=True)
    actual_outcome = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    changed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    change_summary = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint("decision_id", "version_number", name="uq_decision_versions_decision_version"),
    )

    # Relationships
    decision = relationship("Decision", back_populates="versions")
    changer = relationship("User", back_populates="decision_versions")

    def __repr__(self):
        return (
            f"<DecisionVersion(id={self.id}, decision_id={self.decision_id}, "
            f"version_number={self.version_number}, changed_by={self.changed_by})>"
        )
