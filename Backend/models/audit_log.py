from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from database.database import Base


class AuditLog(Base):
    """Immutable record of a significant action taken in the system.

    Rows are never updated or deleted through the API — only ever inserted —
    so this table doubles as the platform's compliance trail. Kept separate
    from DecisionVersion (which stores field-level snapshots of a decision's
    content) since this table is about *events across the whole system*
    (auth, role/team changes, decision lifecycle, approvals, discussion,
    files), not just decision content edits.
    """

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Nullable so failed-login attempts against an unknown email can still be
    # logged (no matching user to attribute the action to).
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_email = Column(String, nullable=True)  # snapshot, survives user deletion

    action = Column(String, nullable=False, index=True)  # e.g. "decision.status_changed"
    entity_type = Column(String, nullable=True, index=True)  # e.g. "decision"
    entity_id = Column(Integer, nullable=True, index=True)

    details = Column(Text, nullable=True)  # short human-readable description
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    actor = relationship("User", foreign_keys=[actor_id])
