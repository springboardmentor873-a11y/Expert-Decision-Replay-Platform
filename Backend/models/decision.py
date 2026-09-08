from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    objective = Column(Text, nullable=True)
    context = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="General", index=True)
    status = Column(String(50), nullable=False, default="Draft", index=True)
    priority = Column(String(50), nullable=False, default="Medium")

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    current_version = Column(Integer, default=1)
    selected_alternative_id = Column(Integer, nullable=True)
    decision_rationale = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", foreign_keys=[created_by_id])
    team = relationship("Team", foreign_keys=[team_id])
    alternatives = relationship("DecisionAlternative", back_populates="decision", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="decision")
    comments = relationship("Comment", back_populates="decision", cascade="all, delete-orphan")
    versions = relationship("DecisionVersion", back_populates="decision", cascade="all, delete-orphan")
