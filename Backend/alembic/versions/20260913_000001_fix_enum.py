"""fix enum values: add uppercase variants for decision_status, approval_action, approval_stage

SQLAlchemy serializes Python str, enum.Enum members using their .name
attribute (UPPERCASE), not their .value.  The original approval-related
migrations created PostgreSQL enum values in lowercase, causing
"invalid input value" errors at runtime.

This migration adds the uppercase variants so SQLAlchemy can write
all enum members.  PostgreSQL does not support removing enum values,
so the original lowercase entries remain (harmless).

Revision ID: 20260913_000001_fix_enum
Revises: 20260913000000_add_approvals
Create Date: 2026-09-13 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260913_000001_fix_enum"
down_revision: Union[str, None] = "20260913000000_add_approvals"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            "ALTER TYPE decision_status ADD VALUE IF NOT EXISTS 'PENDING_MANAGER_REVIEW'"
        )
    )
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
