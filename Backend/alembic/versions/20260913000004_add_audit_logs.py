"""add audit_logs table

Adds the immutable audit trail table backing the audit logging feature.
Rows are appended only — the API exposes no update or delete paths.

Revision ID: 20260913_004
Revises: 20260913_003
Create Date: 2026-09-13 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260913_004"
down_revision: Union[str, None] = "20260913_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=False),
        sa.Column("decision_id", sa.UUID(), nullable=False),
        sa.Column(
            "action",
            sa.Enum(
                "DECISION_CREATED",
                "DECISION_UPDATED",
                "DECISION_SUBMITTED",
                "DECISION_ARCHIVED",
                "REVIEWER_APPROVED",
                "REVIEWER_REJECTED",
                "MANAGER_APPROVED",
                "MANAGER_REJECTED",
                name="audit_action",
            ),
            nullable=False,
        ),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_audit_logs_decision_id"), "audit_logs", ["decision_id"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_actor_id"), "audit_logs", ["actor_id"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_created_at"), "audit_logs", ["created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_logs_created_at"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_actor_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_decision_id"), table_name="audit_logs")
    op.drop_table("audit_logs")