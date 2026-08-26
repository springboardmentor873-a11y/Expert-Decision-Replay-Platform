from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String(30), nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    profile_image = Column(String(255), nullable=True)

    user = relationship("User", back_populates="profile")
