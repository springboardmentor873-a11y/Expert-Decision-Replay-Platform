import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.decision import Decision, DecisionStatusEnum
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest
from app.services.decision_service import (
    create_decision,
    update_decision,
    archive_decision,
    unarchive_decision,
    get_decisions,
)


class TestArchivedDecisions(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.admin_role = Role(id=1, name=RoleEnum.ADMINISTRATOR.value, description="Admin")
        self.mgr_role = Role(id=2, name=RoleEnum.MANAGER.value, description="Manager")
        self.emp_role = Role(id=3, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.db.add_all([self.admin_role, self.mgr_role, self.emp_role])
        self.db.commit()

        self.admin_user = User(
            id=1, email="admin@test.com", full_name="Admin User",
            hashed_password="hashed_password", role_id=1, is_active=True,
        )
        self.emp_user = User(
            id=2, email="emp@test.com", full_name="Employee User",
            hashed_password="hashed_password", role_id=3, is_active=True,
        )
        self.other_user = User(
            id=3, email="other@test.com", full_name="Other User",
            hashed_password="hashed_password", role_id=3, is_active=True,
        )
        self.db.add_all([self.admin_user, self.emp_user, self.other_user])
        self.db.commit()

        # Create decision
        dec_in = DecisionCreateRequest(
            title="Database Migration to Postgres",
            problem_statement="Scale limitations with current SQLite instance",
            context="Enterprise client onboarded with 10M transactions",
            decision_taken="Adopt managed PostgreSQL service",
            reasoning="ACID compliance, relational maturity, JSONB capabilities",
        )
        self.decision = create_decision(self.db, dec_in, self.emp_user.id)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_archive_decision_by_owner(self):
        archived = archive_decision(self.db, self.decision.id, self.emp_user)
        self.assertEqual(archived.status, DecisionStatusEnum.ARCHIVED.value)

    def test_archive_decision_by_admin(self):
        archived = archive_decision(self.db, self.decision.id, self.admin_user)
        self.assertEqual(archived.status, DecisionStatusEnum.ARCHIVED.value)

    def test_archive_permission_denied_for_unrelated_user(self):
        with self.assertRaises(HTTPException) as ctx:
            archive_decision(self.db, self.decision.id, self.other_user)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_archived_decision_is_read_only(self):
        archive_decision(self.db, self.decision.id, self.emp_user)

        with self.assertRaises(HTTPException) as ctx:
            update_decision(
                self.db,
                self.decision.id,
                DecisionUpdateRequest(title="New Title"),
                self.emp_user
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("archived", ctx.exception.detail.lower())

    def test_unarchive_decision_restores_to_draft(self):
        archive_decision(self.db, self.decision.id, self.emp_user)
        restored = unarchive_decision(self.db, self.decision.id, self.emp_user)
        self.assertEqual(restored.status, DecisionStatusEnum.DRAFT.value)

        # Now can update again
        updated = update_decision(
            self.db,
            self.decision.id,
            DecisionUpdateRequest(title="Updated Migration Plan"),
            self.emp_user
        )
        self.assertEqual(updated.title, "Updated Migration Plan")

    def test_search_archived_decisions(self):
        archive_decision(self.db, self.decision.id, self.emp_user)
        res = get_decisions(self.db, self.emp_user, status_filter="Archived")
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0].id, self.decision.id)


if __name__ == "__main__":
    unittest.main()
