from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, pptx, etc.
    file_size = Column(Integer, default=0)
    category = Column(String(100), default="General", index=True)
    tags = Column(Text, nullable=True)  # JSON string of tags e.g. ["AI", "Evaluation"]
    description = Column(Text, nullable=True)

    decision_id = Column(Integer, ForeignKey("decisions.id", ondelete="SET NULL"), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by_id])
    decision = relationship("Decision", back_populates="documents")
