"""add team_join_requests table

Adds persistent storage for the one-user-one-team join request workflow and
the notification types that back it. Creating a request never changes
`users.team_id` — membership is granted only by Manager/Admin approval.

Revision ID: 20260920_000001
Revises: 20260913_004
Create Date: 2026-09-20 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260920_000001"
down_revision: Union[str, None] = "20260913_004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Notification types backing the join request workflow
    op.execute(
        sa.text("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TEAM_JOIN_REQUESTED'")
    )
    op.execute(
        sa.text("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TEAM_JOIN_APPROVED'")
    )
    op.execute(
        sa.text("ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TEAM_JOIN_REJECTED'")
    )

    op.create_table(
        "team_join_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "REJECTED", name="team_join_request_status"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_team_join_requests_user_id"), "team_join_requests", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_team_join_requests_team_id"), "team_join_requests", ["team_id"], unique=False
    )
    op.create_index(
        op.f("ix_team_join_requests_status"), "team_join_requests", ["status"], unique=False
    )
    # At most one open (PENDING) request per user/team; a processed request
    # frees the slot so the user can request again later.
    op.create_index(
        "uq_team_join_requests_pending_user_team",
        "team_join_requests",
        ["user_id", "team_id"],
        unique=True,
        postgresql_where=sa.text("status = 'PENDING'"),
    )


def downgrade() -> None:
    op.drop_index("uq_team_join_requests_pending_user_team", table_name="team_join_requests")
    op.drop_index(op.f("ix_team_join_requests_status"), table_name="team_join_requests")
    op.drop_index(op.f("ix_team_join_requests_team_id"), table_name="team_join_requests")
    op.drop_index(op.f("ix_team_join_requests_user_id"), table_name="team_join_requests")
    op.drop_table("team_join_requests")

    # PostgreSQL does not support removing individual enum values.
    pass