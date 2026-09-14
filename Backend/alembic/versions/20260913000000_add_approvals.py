"""add approvals table and pending_manager_review status

Revision ID: 20260913000000_add_approvals
Revises: e06895e92699
Create Date: 2026-09-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260913000000_add_approvals"
down_revision: Union[str, None] = "e06895e92699"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add PENDING_MANAGER_REVIEW to the decision_status enum
    op.execute(
        sa.text(
            "ALTER TYPE decision_status ADD VALUE IF NOT EXISTS 'PENDING_MANAGER_REVIEW'"
        )
    )

    # Create approvals table
    op.create_table(
        "approvals",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("decision_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.Enum("APPROVE", "REJECT", name="approval_action"), nullable=False),
        sa.Column("approval_stage", sa.Enum("REVIEWER", "MANAGER", name="approval_stage"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("approvals")

    # Removing enum values in PostgreSQL is not straightforward.
    # This is a best-effort downgrade; the enum value removal
    # would require recreating the type, which is not recommended.
    # For development purposes, we leave the enum as-is.
    pass
