from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Float
)

from database.database import Base


# -----------------------------
# DECISION
# -----------------------------

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(
        String(200),
        nullable=False
    )

    problem_statement = Column(
        Text,
        nullable=False
    )

    objective = Column(
        Text,
        nullable=True
    )

    category = Column(
        String(100),
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="Draft"
    )

    rationale = Column(
        Text,
        nullable=True
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


# -----------------------------
# ALTERNATIVE
# -----------------------------

class Alternative(Base):
    __tablename__ = "alternatives"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey(
            "decisions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    name = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    pros = Column(
        Text,
        nullable=True
    )

    cons = Column(
        Text,
        nullable=True
    )

    cost = Column(
        Float,
        nullable=True
    )

    feasibility = Column(
        String(50),
        nullable=True
    )

    risk = Column(
        String(50),
        nullable=True
    )

    score = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# -----------------------------
# DISCUSSION
# -----------------------------

class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey(
            "decisions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    content = Column(
        Text,
        nullable=False
    )

    note_type = Column(
        String(30),
        nullable=False,
        default="Comment"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# -----------------------------
# FILES
# -----------------------------

class DecisionFile(Base):
    __tablename__ = "decision_files"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey(
            "decisions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    original_name = Column(
        String(255),
        nullable=False
    )

    stored_name = Column(
        String(255),
        unique=True,
        nullable=False
    )

    content_type = Column(
        String(150),
        nullable=True
    )

    size = Column(
        Integer,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# -----------------------------
# VERSION HISTORY
# -----------------------------

class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    decision_id = Column(
        Integer,
        ForeignKey(
            "decisions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    version_number = Column(
        Integer,
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    problem_statement = Column(
        Text,
        nullable=False
    )

    objective = Column(
        Text,
        nullable=True
    )

    category = Column(
        String(100),
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False
    )

    rationale = Column(
        Text,
        nullable=True
    )

    snapshot_json = Column(
        Text,
        nullable=False
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )