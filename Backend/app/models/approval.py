import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ApprovalAction(str, enum.Enum):
    APPROVE = "approve"
    REJECT = "reject"


class ApprovalStage(str, enum.Enum):
    REVIEWER = "reviewer"
    MANAGER = "manager"


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decisions.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    action: Mapped[ApprovalAction] = mapped_column(
        Enum(ApprovalAction, name="approval_action"), nullable=False
    )
    approval_stage: Mapped[ApprovalStage] = mapped_column(
        Enum(ApprovalStage, name="approval_stage"), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    decision: Mapped["Decision"] = relationship(back_populates="approvals")  # noqa: F821
    user: Mapped["User"] = relationship(back_populates="approvals")  # noqa: F821
