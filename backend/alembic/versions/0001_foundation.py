"""Foundation schema: identity, decisions, collaboration, audit.

Revision ID: 0001_foundation
Revises:
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

from app.db.base import Base
import app.models  # noqa: F401

revision: str = "0001_foundation"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ROLES = (
    ("employee", "Employee"),
    ("reviewer", "Reviewer"),
    ("manager", "Manager"),
    ("administrator", "Administrator"),
)


def upgrade() -> None:
    bind = op.get_bind()
    bind.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    Base.metadata.create_all(bind=bind)

    now = datetime.now(UTC)
    roles_table = sa.table(
        "roles",
        sa.column("id", sa.Uuid),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("is_system", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        roles_table,
        [
            {
                "id": uuid4(),
                "code": code,
                "name": name,
                "description": f"System role: {name}",
                "is_system": True,
                "created_at": now,
                "updated_at": now,
            }
            for code, name in ROLES
        ],
    )


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
