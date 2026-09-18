from datetime import datetime, timezone
import enum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class JoinRequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TeamJoinRequest(Base):
    __tablename__ = "team_join_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        String(50),
        default="PENDING",
        nullable=False,
        index=True,
    )
    message = Column(Text, nullable=True)
    reviewed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    team = relationship("Team", backref="join_requests")
    user = relationship("User", foreign_keys=[user_id], backref="team_join_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviewed_team_join_requests")

    def __repr__(self):
        return f"<TeamJoinRequest(id={self.id}, team_id={self.team_id}, user_id={self.user_id}, status='{self.status}')>"
