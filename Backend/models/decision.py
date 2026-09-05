import enum

from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from database.database import Base


class DecisionCategory(str, enum.Enum):
    architecture = "Architecture"
    infrastructure = "Infrastructure"
    security = "Security"
    process = "Process"


class DecisionStatus(str, enum.Enum):
    draft = "Draft"
    under_review = "Under Review"
    approved = "Approved"
    rejected = "Rejected"
    archived = "Archived"


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=True)
    category = Column(Enum(DecisionCategory), nullable=False)
    status = Column(Enum(DecisionStatus), default=DecisionStatus.draft, nullable=False)
    rationale = Column(Text, nullable=True)
    version = Column(Integer, default=1, nullable=False)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="decisions", foreign_keys=[created_by_id])
    alternatives = relationship("Alternative", back_populates="decision", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="decision", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="decision", cascade="all, delete-orphan")
    versions = relationship("DecisionVersion", back_populates="decision", cascade="all, delete-orphan")
