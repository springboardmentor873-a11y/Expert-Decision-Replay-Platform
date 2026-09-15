from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.id"),
        nullable=False
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    filename = Column(String, nullable=False)

    stored_path = Column(String, nullable=False)

    file_size = Column(Integer, nullable=False)

    content_type = Column(String, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    decision = relationship(
        "Decision",
        back_populates="documents"
    )

    uploader = relationship(
        "User",
        back_populates="documents"
    )
