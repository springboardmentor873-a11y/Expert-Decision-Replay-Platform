"""add uppercase approval_action and approval_stage enum values

The previous fix_enum migration was modified after being applied, so the
approval_action / approval_stage ALTER TYPE statements were never executed.
This migration adds the missing uppercase values safely via IF NOT EXISTS.

decision_status / PENDING_MANAGER_REVIEW was already applied successfully
and is NOT duplicated here.

Revision ID: 20260913_002
Revises: 20260913_000001_fix_enum
Create Date: 2026-09-13 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260913_002"
down_revision: Union[str, None] = "20260913_000001_fix_enum"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TYPE approval_action ADD VALUE IF NOT EXISTS 'APPROVE'"
        )
    )
    op.execute(
        sa.text(
            "ALTER TYPE approval_action ADD VALUE IF NOT EXISTS 'REJECT'"
        )
    )
    op.execute(
        sa.text(
            "ALTER TYPE approval_stage ADD VALUE IF NOT EXISTS 'REVIEWER'"
        )
    )
    op.execute(
        sa.text(
            "ALTER TYPE approval_stage ADD VALUE IF NOT EXISTS 'MANAGER'"
        )
    )


def downgrade() -> None:
    # PostgreSQL does not support removing individual enum values.
    pass
