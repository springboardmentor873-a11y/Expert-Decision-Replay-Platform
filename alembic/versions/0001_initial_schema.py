"""initial schema

This is the single, authoritative starting migration for the Expert
Decision Replay Platform. It replaces the previous 34-file migration
history (which contained multiple independent chains / duplicate
"create X table" revisions and could not run cleanly with
`alembic upgrade head`).

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("employee_id", sa.String(), nullable=False, unique=True),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("designation", sa.String(), nullable=False),
        sa.Column("phone_number", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # decisions
    # ------------------------------------------------------------------
    op.create_table(
        "decisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("problem_statement", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="Draft"),
        sa.Column("tags", sa.String(), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_decisions_id", "decisions", ["id"])

    # ------------------------------------------------------------------
    # alternatives
    # ------------------------------------------------------------------
    op.create_table(
        "alternatives",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("pros", sa.String(), nullable=False),
        sa.Column("cons", sa.String(), nullable=False),
        sa.Column("estimated_cost", sa.Integer(), nullable=False),
        sa.Column("feasibility_score", sa.Integer(), nullable=False),
        sa.Column("risk_level", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_alternatives_id", "alternatives", ["id"])

    # ------------------------------------------------------------------
    # comments
    # ------------------------------------------------------------------
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_comments_id", "comments", ["id"])

    # ------------------------------------------------------------------
    # discussion_threads
    # ------------------------------------------------------------------
    op.create_table(
        "discussion_threads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_discussion_threads_id", "discussion_threads", ["id"])

    # ------------------------------------------------------------------
    # thread_replies
    # ------------------------------------------------------------------
    op.create_table(
        "thread_replies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("thread_id", sa.Integer(), sa.ForeignKey("discussion_threads.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_thread_replies_id", "thread_replies", ["id"])

    # ------------------------------------------------------------------
    # meeting_notes
    # ------------------------------------------------------------------
    op.create_table(
        "meeting_notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_meeting_notes_id", "meeting_notes", ["id"])

    # ------------------------------------------------------------------
    # decision_rationales
    # ------------------------------------------------------------------
    op.create_table(
        "decision_rationales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False, unique=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_decision_rationales_id", "decision_rationales", ["id"])

    # ------------------------------------------------------------------
    # activities
    # ------------------------------------------------------------------
    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_activities_id", "activities", ["id"])

    # ------------------------------------------------------------------
    # audit_logs
    # ------------------------------------------------------------------
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("request_method", sa.String(), nullable=True),
        sa.Column("endpoint", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_id", "audit_logs", ["id"])

    # ------------------------------------------------------------------
    # decision_versions
    # ------------------------------------------------------------------
    op.create_table(
        "decision_versions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("problem_statement", sa.Text(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("change_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_decision_versions_id", "decision_versions", ["id"])

    # ------------------------------------------------------------------
    # approvals
    # ------------------------------------------------------------------
    op.create_table(
        "approvals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("decision_id", sa.Integer(), sa.ForeignKey("decisions.id"), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("approval_level", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="Pending"),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_approvals_id", "approvals", ["id"])

    # ------------------------------------------------------------------
    # teams
    # ------------------------------------------------------------------
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_teams_id", "teams", ["id"])

    # ------------------------------------------------------------------
    # team_members
    # ------------------------------------------------------------------
    op.create_table(
        "team_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_team_members_id", "team_members", ["id"])


def downgrade() -> None:
    op.drop_table("team_members")
    op.drop_table("teams")
    op.drop_table("approvals")
    op.drop_table("decision_versions")
    op.drop_table("audit_logs")
    op.drop_table("activities")
    op.drop_table("decision_rationales")
    op.drop_table("meeting_notes")
    op.drop_table("thread_replies")
    op.drop_table("discussion_threads")
    op.drop_table("comments")
    op.drop_table("alternatives")
    op.drop_table("decisions")
    op.drop_table("users")
