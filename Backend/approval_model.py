from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey

from database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False,
        index=True
    )

    requested_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    status = Column(
        String,
        default="Pending",
        nullable=False
    )

    comments = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    reviewed_at = Column(
        DateTime,
        nullable=True
    )