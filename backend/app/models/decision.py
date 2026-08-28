from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Decision(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "decisions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','in_review','in_approval','approved','implementing',"
            "'implemented','closed','rejected','changes_requested')",
            name="status",
        ),
        CheckConstraint(
            "implementation_status IN ('not_started','in_progress','blocked','completed','cancelled')",
            name="implementation_status",
        ),
    )

    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("decision_categories.id", ondelete="SET NULL")
    )
    team_id: Mapped[UUID | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"))
    approval_workflow_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("approval_workflows.id", ondelete="RESTRICT")
    )
    selected_alternative_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "alternatives.id",
            ondelete="SET NULL",
            use_alter=True,
            name="fk_decisions_selected_alternative_id_alternatives",
        )
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft")
    implementation_status: Mapped[str] = mapped_column(
        String(40), nullable=False, default="not_started"
    )
    current_version_no: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    outcome_summary: Mapped[str | None] = mapped_column(Text)
    outcome_recorded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    outcome_recorded_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )

    alternatives: Mapped[list["Alternative"]] = relationship(
        back_populates="decision",
        foreign_keys="Alternative.decision_id",
    )


class Alternative(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "alternatives"

    decision_id: Mapped[UUID] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    decision: Mapped[Decision] = relationship(
        back_populates="alternatives", foreign_keys=[decision_id]
    )


class EvaluationCriterion(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "evaluation_criteria"
    __table_args__ = (CheckConstraint("weight > 0", name="weight_positive"),)

    decision_id: Mapped[UUID] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    weight: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class AlternativeEvaluation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "alternative_evaluations"
    __table_args__ = (
        UniqueConstraint("alternative_id", "criterion_id", name="uq_eval_alt_criterion"),
        CheckConstraint("score >= 0", name="score_non_negative"),
    )

    decision_id: Mapped[UUID] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    alternative_id: Mapped[UUID] = mapped_column(
        ForeignKey("alternatives.id", ondelete="CASCADE"), nullable=False
    )
    criterion_id: Mapped[UUID] = mapped_column(
        ForeignKey("evaluation_criteria.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    evaluated_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))


class Risk(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "risks"

    decision_id: Mapped[UUID] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    likelihood: Mapped[str] = mapped_column(String(20), nullable=False)
    mitigation: Mapped[str | None] = mapped_column(Text)


class Stakeholder(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "stakeholders"

    decision_id: Mapped[UUID] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    stakeholder_role: Mapped[str | None] = mapped_column(String(120))


class DecisionVersion(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "decision_versions"
    __table_args__ = (UniqueConstraint("decision_id", "version_no", name="uq_decision_versions_no"),)

    decision_id: Mapped[UUID] = mapped_column(
        ForeignKey("decisions.id", ondelete="RESTRICT"), nullable=False
    )
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(80), nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_by_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
