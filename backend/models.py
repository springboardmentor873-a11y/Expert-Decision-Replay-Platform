from sqlalchemy import Column, Integer, String, Enum, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class RoleEnum(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    REVIEWER = "REVIEWER"
    MANAGER = "MANAGER"
    ADMINISTRATOR = "ADMINISTRATOR"

class DecisionStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True)

    decisions = relationship("Decision", back_populates="creator")
    discussions = relationship("Discussion", back_populates="user")
    documents = relationship("Document", back_populates="uploaded_by")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    category = Column(String, index=True)
    status = Column(Enum(DecisionStatusEnum), default=DecisionStatusEnum.DRAFT)
    version = Column(Integer, default=1)
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="decisions")
    alternatives = relationship("Alternative", back_populates="decision", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="decision", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="decision", cascade="all, delete-orphan")

class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    description = Column(Text, nullable=False)
    pros = Column(Text)
    cons = Column(Text)
    cost = Column(String)
    feasibility = Column(String)
    risk = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="alternatives")

class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="discussions")
    user = relationship("User", back_populates="discussions")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="documents")
    uploaded_by = relationship("User", back_populates="documents")
