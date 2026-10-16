from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from database.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # relative path under static/uploads/
    file_size = Column(Integer, nullable=False)  # bytes
    content_type = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    decision = relationship("Decision", back_populates="attachments")
    uploaded_by = relationship("User", back_populates="attachments")
