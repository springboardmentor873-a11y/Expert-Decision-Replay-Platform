"""add documents, is_selected, user_settings

Revision ID: 0002_docs
Revises: 0001_initial_schema
Create Date: 2026-09-08 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0002_docs"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # documents — file attachments on decisions
    # ------------------------------------------------------------------
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("stored_path", sa.String(), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("content_type", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_documents_id", "documents", ["id"])

    # ------------------------------------------------------------------
    # alternatives — add is_selected flag
    # ------------------------------------------------------------------
    op.add_column(
        "alternatives",
        sa.Column("is_selected", sa.Boolean(), nullable=False, server_default=sa.false())
    )

    # ------------------------------------------------------------------
    # user_settings — per-user notification preferences
    # ------------------------------------------------------------------
    op.create_table(
        "user_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("settings_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_settings_id", "user_settings", ["id"])


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_column("alternatives", "is_selected")
    op.drop_table("documents")
