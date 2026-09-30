"""add repository_documents table

Adds the read-only Knowledge Repository document store. Documents are curated
knowledge entries (currently seeded for development); the Repository has no
upload/write path by design.

Revision ID: 20260921_000001
Revises: 20260920_000001
Create Date: 2026-09-21 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260921_000001"
down_revision: Union[str, None] = "20260920_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "repository_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("team_id", sa.UUID(), nullable=True),
        sa.Column("uploaded_by", sa.UUID(), nullable=True),
        sa.Column("decision_id", sa.UUID(), nullable=True),
        sa.Column("file_type", sa.String(length=20), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("content_path", sa.String(length=500), nullable=True),
        sa.Column("content_type", sa.String(length=120), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"]),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_repository_documents_team_id"), "repository_documents", ["team_id"], unique=False
    )
    op.create_index(
        op.f("ix_repository_documents_uploaded_by"),
        "repository_documents",
        ["uploaded_by"],
        unique=False,
    )
    op.create_index(
        op.f("ix_repository_documents_decision_id"),
        "repository_documents",
        ["decision_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_repository_documents_file_type"),
        "repository_documents",
        ["file_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_repository_documents_created_at"),
        "repository_documents",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_repository_documents_created_at"), table_name="repository_documents")
    op.drop_index(op.f("ix_repository_documents_file_type"), table_name="repository_documents")
    op.drop_index(op.f("ix_repository_documents_decision_id"), table_name="repository_documents")
    op.drop_index(op.f("ix_repository_documents_uploaded_by"), table_name="repository_documents")
    op.drop_index(op.f("ix_repository_documents_team_id"), table_name="repository_documents")
    op.drop_table("repository_documents")