import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TeamJoinRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TeamJoinRequest(Base):
    """
    A user asking to join a team. Membership only changes when a Manager/
    Administrator approves the request — creating one never touches
    `users.team_id`. One user = one team, and a user can have at most one
    *pending* request per team (enforced in the service and by the partial
    unique index below).
    """
    __tablename__ = "team_join_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False
    )
    status: Mapped[TeamJoinRequestStatus] = mapped_column(
        Enum(TeamJoinRequestStatus, name="team_join_request_status"),
        default=TeamJoinRequestStatus.PENDING,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    user: Mapped["User"] = relationship(  # noqa: F821
        back_populates="join_requests", foreign_keys="TeamJoinRequest.user_id"
    )
    team: Mapped["Team"] = relationship(  # noqa: F821
        back_populates="join_requests", foreign_keys="TeamJoinRequest.team_id"
    )
    reviewer: Mapped["User"] = relationship(  # noqa: F821
        back_populates="reviewed_join_requests", foreign_keys="TeamJoinRequest.reviewed_by"
    )

    # At most one *open* request per user/team. A rejected/approved request
    # frees the slot so the user can request again later.
    __table_args__ = (
        Index(
            "uq_team_join_requests_pending_user_team",
            "user_id",
            "team_id",
            unique=True,
            postgresql_where=text("status = 'PENDING'"),
            sqlite_where=text("status = 'PENDING'"),
        ),
        Index("ix_team_join_requests_user_id", "user_id"),
        Index("ix_team_join_requests_team_id", "team_id"),
        Index("ix_team_join_requests_status", "status"),
    )