from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)

    decisions = relationship("Decision", back_populates="user")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    problem = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    final_decision = Column(Text, nullable=True)
    status = Column(String(50), default="Draft")
    category = Column(String(100), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="decisions")
    alternatives = relationship("Alternative", back_populates="decision")
    reviews = relationship("Review", back_populates="decision")
    history = relationship("DecisionHistory", back_populates="decision")
    outcome = relationship("Outcome", back_populates="decision", uselist=False)
    documents = relationship("Document", back_populates="decision")
    comments = relationship("Comment", back_populates="decision")


class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)

    decision = relationship("Decision", back_populates="alternatives")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    comment = Column(Text, nullable=False)
    status = Column(String(50), default="Pending")
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)

    decision = relationship("Decision", back_populates="reviews")


class DecisionHistory(Base):
    __tablename__ = "decision_history"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    description = Column(Text)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="history")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, index=True)
    expected_outcome = Column(Text)
    actual_outcome = Column(Text)
    result = Column(String(100))
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)

    decision = relationship("Decision", back_populates="outcome")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="documents")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    is_meeting_note = Column(Integer, default=0)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="comments")