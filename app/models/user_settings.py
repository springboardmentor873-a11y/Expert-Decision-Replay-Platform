from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    # JSON blob storing notification preferences and other settings.
    # Schema: {"notify_on_comment": bool, "notify_on_approval": bool,
    #          "notify_on_status_change": bool, "digest_frequency": str}
    settings_json = Column(
        Text,
        nullable=False,
        default="{}"
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = relationship(
        "User",
        back_populates="settings"
    )
