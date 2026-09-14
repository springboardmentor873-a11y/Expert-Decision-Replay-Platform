import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditAction(str, enum.Enum):
    """
    The set of auditable actions. PostgreSQL enum values must match the
    UPPERCASE member names (see other enums in this codebase).
    """
    DECISION_CREATED = "decision_created"
    DECISION_UPDATED = "decision_updated"
    DECISION_SUBMITTED = "decision_submitted"
    DECISION_ARCHIVED = "decision_archived"
    REVIEWER_APPROVED = "reviewer_approved"
    REVIEWER_REJECTED = "reviewer_rejected"
    MANAGER_APPROVED = "manager_approved"
    MANAGER_REJECTED = "manager_rejected"


class AuditLog(Base):
    """
    Immutable audit trail. Rows are created once and never edited or deleted —
    the API intentionally exposes no update/delete endpoints for this table.
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False
    )
    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decisions.id"), index=True, nullable=False
    )
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action"), nullable=False
    )
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    actor: Mapped["User"] = relationship(foreign_keys=[actor_id])  # noqa: F821
    decision: Mapped["Decision"] = relationship(foreign_keys=[decision_id])  # noqa: F821

    @property
    def actor_name(self) -> str | None:
        return self.actor.full_name if self.actor else None

    @property
    def decision_title(self) -> str | None:
        return self.decision.title if self.decision else None