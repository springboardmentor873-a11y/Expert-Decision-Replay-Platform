"""add notifications table

Adds the notifications table backing the in-app notification bell:
each notification targets a single user, optionally links to a decision,
and is flagged read/unread.

Revision ID: 20260913_003
Revises: 20260913_002
Create Date: 2026-09-13 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260913_003"
down_revision: Union[str, None] = "20260913_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "notification_type",
            sa.Enum(
                "APPROVAL_REQUESTED",
                "APPROVAL_MOVED",
                "DECISION_APPROVED",
                "DECISION_REJECTED",
                "RETURNED_FOR_REVISION",
                "GENERAL",
                name="notification_type",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("decision_id", sa.UUID(), nullable=True),
        sa.Column("is_read", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["decision_id"], ["decisions.id"], ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notifications_user_id_read"),
        "notifications",
        ["user_id", "is_read"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_user_id_read"), table_name="notifications")
    op.drop_table("notifications")