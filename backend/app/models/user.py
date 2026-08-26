from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from backend.app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    team = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    