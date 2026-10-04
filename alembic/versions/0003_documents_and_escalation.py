"""add documents table + approval escalation column

Revision ID: 0003_documents_and_escalation
Revises: 0002_add_notifications
Create Date: 2026-03-15 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "0003_documents_and_escalation"
down_revision = "0002_add_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("stored_path", sa.String(), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_documents_id", "documents", ["id"])
    op.create_index("ix_documents_decision_id", "documents", ["decision_id"])

    with op.batch_alter_table("approvals") as batch_op:
        batch_op.add_column(
            sa.Column("escalated_from_id", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_approvals_escalated_from_id",
            "approvals",
            ["escalated_from_id"],
            ["id"],
        )

    with op.batch_alter_table("alternatives") as batch_op:
        batch_op.add_column(
            sa.Column("is_selected", sa.Boolean(), nullable=False, server_default=sa.false())
        )


def downgrade() -> None:
    with op.batch_alter_table("alternatives") as batch_op:
        batch_op.drop_column("is_selected")

    with op.batch_alter_table("approvals") as batch_op:
        batch_op.drop_constraint("fk_approvals_escalated_from_id", type_="foreignkey")
        batch_op.drop_column("escalated_from_id")

    op.drop_index("ix_documents_decision_id", table_name="documents")
    op.drop_index("ix_documents_id", table_name="documents")
    op.drop_table("documents")
