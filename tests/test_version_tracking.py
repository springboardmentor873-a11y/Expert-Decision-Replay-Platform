"""
Test Suite: Milestone 2 - Version Tracking
Tests decision snapshotting on creation, edits, submission, sequential numbering,
deterministic change summaries, immutability, authorization/RBAC, and version comparison.
"""

import os
import sys
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException, status

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.decision import Decision, DecisionStatusEnum
from app.models.decision_version import DecisionVersion
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest
from app.services.decision_service import create_decision, delete_decision, submit_decision, update_decision
from app.services.decision_version_service import (
    compare_versions,
    generate_change_summary,
    get_latest_version,
    get_version,
    get_versions,
)
from app.api.routes.decision_versions import (
    compare_decision_versions,
    get_single_decision_version,
    list_decision_versions,
)


class TestVersionTracking(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.SessionLocal = sessionmaker(bind=cls.engine, autocommit=False, autoflush=False)
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed roles
        for r_name in [RoleEnum.EMPLOYEE.value, RoleEnum.REVIEWER.value, RoleEnum.MANAGER.value, RoleEnum.ADMINISTRATOR.value]:
            if not self.db.query(Role).filter(Role.name == r_name).first():
                self.db.add(Role(name=r_name, description=f"{r_name} role"))
        self.db.commit()

        emp_role = self.db.query(Role).filter(Role.name == RoleEnum.EMPLOYEE.value).first()
        rev_role = self.db.query(Role).filter(Role.name == RoleEnum.REVIEWER.value).first()
        adm_role = self.db.query(Role).filter(Role.name == RoleEnum.ADMINISTRATOR.value).first()

        self.alice = self.db.query(User).filter(User.email == "alice_ver@test.com").first()
        if not self.alice:
            self.alice = User(full_name="Alice Employee", email="alice_ver@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.alice)

        self.bob = self.db.query(User).filter(User.email == "bob_ver@test.com").first()
        if not self.bob:
            self.bob = User(full_name="Bob Employee", email="bob_ver@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.bob)

        self.reviewer = self.db.query(User).filter(User.email == "reviewer_ver@test.com").first()
        if not self.reviewer:
            self.reviewer = User(full_name="Charlie Reviewer", email="reviewer_ver@test.com", hashed_password="hash", role_id=rev_role.id)
            self.db.add(self.reviewer)

        self.admin = self.db.query(User).filter(User.email == "admin_ver@test.com").first()
        if not self.admin:
            self.admin = User(full_name="Dave Admin", email="admin_ver@test.com", hashed_password="hash", role_id=adm_role.id)
            self.db.add(self.admin)

        self.db.commit()

        # Helper method for creating standard decision request
        self.initial_req = DecisionCreateRequest(
            title="Adopt Cloud Infrastructure",
            problem_statement="Legacy on-premises servers have high maintenance costs",
            context="Scalability requirements for Q4",
            decision_taken="Migrate workloads to AWS",
            reasoning="AWS offers managed PostgreSQL and Elastic Kubernetes Service",
            expected_outcome="30% reduction in infrastructure overhead",
            actual_outcome=None,
        )

    def tearDown(self):
        self.db.close()

    def test_01_create_decision_creates_version_1(self):
        """Test that creating a Decision automatically creates Version 1."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        versions = self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision.id).all()
        self.assertEqual(len(versions), 1)
        v1 = versions[0]
        self.assertEqual(v1.version_number, 1)
        self.assertEqual(v1.change_summary, "Initial decision created")

    def test_02_version_1_contains_complete_data(self):
        """Test that Version 1 snapshot contains complete decision fields."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        v1 = self.db.query(DecisionVersion).filter(
            DecisionVersion.decision_id == decision.id,
            DecisionVersion.version_number == 1
        ).first()

        self.assertEqual(v1.title, "Adopt Cloud Infrastructure")
        self.assertEqual(v1.problem_statement, "Legacy on-premises servers have high maintenance costs")
        self.assertEqual(v1.context, "Scalability requirements for Q4")
        self.assertEqual(v1.decision_taken, "Migrate workloads to AWS")
        self.assertEqual(v1.reasoning, "AWS offers managed PostgreSQL and Elastic Kubernetes Service")
        self.assertEqual(v1.expected_outcome, "30% reduction in infrastructure overhead")
        self.assertIsNone(v1.actual_outcome)
        self.assertEqual(v1.status, DecisionStatusEnum.DRAFT.value)

    def test_03_version_1_has_correct_changed_by(self):
        """Test that Version 1 changed_by matches authenticated user ID."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        v1 = self.db.query(DecisionVersion).filter(
            DecisionVersion.decision_id == decision.id,
            DecisionVersion.version_number == 1
        ).first()

        self.assertEqual(v1.changed_by, self.alice.id)

    def test_04_editing_decision_creates_version_2(self):
        """Test that editing a Decision creates Version 2 with new values."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        update_req = DecisionUpdateRequest(reasoning="AWS offers managed Aurora PostgreSQL and multi-AZ support")
        updated = update_decision(self.db, decision.id, update_req, self.alice)

        versions = self.db.query(DecisionVersion).filter(
            DecisionVersion.decision_id == decision.id
        ).order_by(DecisionVersion.version_number.asc()).all()

        self.assertEqual(len(versions), 2)
        v2 = versions[1]
        self.assertEqual(v2.version_number, 2)
        self.assertEqual(v2.reasoning, "AWS offers managed Aurora PostgreSQL and multi-AZ support")
        self.assertEqual(v2.change_summary, "Updated: reasoning")
        self.assertEqual(v2.changed_by, self.alice.id)

    def test_05_version_2_contains_complete_updated_snapshot(self):
        """Test that Version 2 contains the full snapshot, including unchanged fields."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        update_req = DecisionUpdateRequest(title="Adopt Cloud Infrastructure - AWS EKS")
        update_decision(self.db, decision.id, update_req, self.alice)

        v2 = self.db.query(DecisionVersion).filter(
            DecisionVersion.decision_id == decision.id,
            DecisionVersion.version_number == 2
        ).first()

        self.assertEqual(v2.title, "Adopt Cloud Infrastructure - AWS EKS")
        # Unchanged fields should be fully preserved
        self.assertEqual(v2.problem_statement, "Legacy on-premises servers have high maintenance costs")
        self.assertEqual(v2.context, "Scalability requirements for Q4")
        self.assertEqual(v2.decision_taken, "Migrate workloads to AWS")
        self.assertEqual(v2.reasoning, "AWS offers managed PostgreSQL and Elastic Kubernetes Service")
        self.assertEqual(v2.expected_outcome, "30% reduction in infrastructure overhead")

    def test_06_multiple_edits_create_sequential_versions(self):
        """Test multiple edits produce sequential version numbers: 1 -> 2 -> 3 -> 4."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        # Edit 1 -> v2
        update_decision(self.db, decision.id, DecisionUpdateRequest(context="Updated context 1"), self.alice)
        # Edit 2 -> v3
        update_decision(self.db, decision.id, DecisionUpdateRequest(expected_outcome="40% reduction"), self.alice)
        # Edit 3 -> v4
        update_decision(self.db, decision.id, DecisionUpdateRequest(actual_outcome="Achieved 42% cost savings"), self.alice)

        versions = self.db.query(DecisionVersion).filter(
            DecisionVersion.decision_id == decision.id
        ).order_by(DecisionVersion.version_number.asc()).all()

        version_numbers = [v.version_number for v in versions]
        self.assertEqual(version_numbers, [1, 2, 3, 4])

    def test_07_version_numbering_is_per_decision(self):
        """Test that version numbering is scoped per decision (not a global counter)."""
        dec1 = create_decision(self.db, self.initial_req, self.alice.id)
        update_decision(self.db, dec1.id, DecisionUpdateRequest(reasoning="Dec 1 Reasoning v2"), self.alice)
        update_decision(self.db, dec1.id, DecisionUpdateRequest(reasoning="Dec 1 Reasoning v3"), self.alice)

        dec2_req = DecisionCreateRequest(
            title="Frontend Framework Selection",
            problem_statement="Choose SPA framework",
            context="Modern UI team",
            decision_taken="React + Vite",
            reasoning="Component ecosystem and performance",
        )
        dec2 = create_decision(self.db, dec2_req, self.alice.id)

        dec1_versions = [v.version_number for v in self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == dec1.id).order_by(DecisionVersion.version_number.asc()).all()]
        dec2_versions = [v.version_number for v in self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == dec2.id).order_by(DecisionVersion.version_number.asc()).all()]

        self.assertEqual(dec1_versions, [1, 2, 3])
        self.assertEqual(dec2_versions, [1])  # Fresh start from 1

    def test_08_saving_without_changes_does_not_create_new_version(self):
        """Test that submitting an update with identical values does not create a new version."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        # Re-save with exact same values
        no_op_req = DecisionUpdateRequest(
            title="Adopt Cloud Infrastructure",
            problem_statement="Legacy on-premises servers have high maintenance costs",
            reasoning="AWS offers managed PostgreSQL and Elastic Kubernetes Service",
        )
        update_decision(self.db, decision.id, no_op_req, self.alice)

        count = self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision.id).count()
        self.assertEqual(count, 1)

    def test_09_change_summary_identifies_changed_fields(self):
        """Test deterministic change summary correctly enumerates modified fields."""
        old = {"title": "A", "reasoning": "R1", "expected_outcome": None}
        new = {"title": "B", "reasoning": "R2", "expected_outcome": "Outcome"}
        summary = generate_change_summary(old, new)
        self.assertEqual(summary, "Updated: title, reasoning, expected_outcome")

        # Test single field change
        single_summary = generate_change_summary({"reasoning": "old"}, {"reasoning": "new"})
        self.assertEqual(single_summary, "Updated: reasoning")

    def test_10_submit_creates_version(self):
        """Test that submitting a draft decision creates a new version with 'Decision submitted for review'."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        submitted = submit_decision(self.db, decision.id, self.alice)
        self.assertEqual(submitted.status, DecisionStatusEnum.SUBMITTED.value)

        latest = get_latest_version(self.db, decision.id, self.alice)
        self.assertIsNotNone(latest)
        self.assertEqual(latest.version_number, 2)
        self.assertEqual(latest.status, DecisionStatusEnum.SUBMITTED.value)
        self.assertEqual(latest.change_summary, "Decision submitted for review")
        self.assertEqual(latest.changed_by, self.alice.id)

    def test_11_version_history_ordered_desc(self):
        """Test that listing versions returns them ordered by version_number DESC (newest first)."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        update_decision(self.db, decision.id, DecisionUpdateRequest(title="Title v2"), self.alice)
        update_decision(self.db, decision.id, DecisionUpdateRequest(title="Title v3"), self.alice)

        versions = list_decision_versions(decision_id=decision.id, db=self.db, current_user=self.alice)
        self.assertEqual(len(versions), 3)
        self.assertEqual([v.version_number for v in versions], [3, 2, 1])

    def test_12_individual_version_retrieval(self):
        """Test retrieving a specific historical version by version number and by version ID."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        update_decision(self.db, decision.id, DecisionUpdateRequest(title="Title v2"), self.alice)

        # Retrieve by version number
        v1 = get_single_decision_version(decision_id=decision.id, version_id=1, db=self.db, current_user=self.alice)
        self.assertEqual(v1.version_number, 1)
        self.assertEqual(v1.title, "Adopt Cloud Infrastructure")

        v2 = get_single_decision_version(decision_id=decision.id, version_id=2, db=self.db, current_user=self.alice)
        self.assertEqual(v2.version_number, 2)
        self.assertEqual(v2.title, "Title v2")

    def test_13_compare_versions_single_change(self):
        """Test comparing two versions with a single field change."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        update_decision(self.db, decision.id, DecisionUpdateRequest(reasoning="Updated reasoning only"), self.alice)

        diff = compare_decision_versions(
            decision_id=decision.id,
            version_a=1,
            version_b=2,
            db=self.db,
            current_user=self.alice
        )

        self.assertEqual(diff["decision_id"], decision.id)
        self.assertEqual(diff["version_a"], 1)
        self.assertEqual(diff["version_b"], 2)
        self.assertEqual(len(diff["changes"]), 1)
        self.assertEqual(diff["changes"][0]["field"], "reasoning")
        self.assertEqual(diff["changes"][0]["old_value"], "AWS offers managed PostgreSQL and Elastic Kubernetes Service")
        self.assertEqual(diff["changes"][0]["new_value"], "Updated reasoning only")

    def test_14_compare_versions_multiple_changes(self):
        """Test comparing two versions with multiple changed fields."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        update_decision(
            self.db,
            decision.id,
            DecisionUpdateRequest(
                title="Adopt Multi-Cloud Architecture",
                context="Enterprise multi-region expansion",
                expected_outcome="50% cost savings",
            ),
            self.alice
        )

        diff = compare_decision_versions(
            decision_id=decision.id,
            version_a=1,
            version_b=2,
            db=self.db,
            current_user=self.alice
        )

        changed_fields = [c["field"] for c in diff["changes"]]
        self.assertIn("title", changed_fields)
        self.assertIn("context", changed_fields)
        self.assertIn("expected_outcome", changed_fields)
        self.assertEqual(len(diff["changes"]), 3)

    def test_15_compare_versions_different_decisions_rejected(self):
        """Test that comparing version belonging to another decision returns 404."""
        dec1 = create_decision(self.db, self.initial_req, self.alice.id)
        dec2 = create_decision(self.db, self.initial_req, self.alice.id)

        # Attempt to compare version 1 of dec1 with a non-existent version in dec1
        with self.assertRaises(HTTPException) as ctx:
            compare_decision_versions(
                decision_id=dec1.id,
                version_a=1,
                version_b=999,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)

    def test_16_historical_versions_are_immutable(self):
        """Test that no update route exists and versions cannot be altered."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        v1 = self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision.id).first()

        # Check that there is no update service function
        import app.services.decision_version_service as dvs
        self.assertFalse(hasattr(dvs, "update_version"))
        self.assertFalse(hasattr(dvs, "delete_version"))

    def test_17_historical_versions_cannot_be_deleted(self):
        """Test that no delete route exists for historical versions."""
        import app.api.routes.decision_versions as dvr
        # Check router methods registered
        routes = [route.path for route in dvr.router.routes]
        self.assertNotIn("delete", [getattr(r, "methods", set()) for r in dvr.router.routes])

    def test_18_unauthorized_users_cannot_view_versions(self):
        """Test unauthorized user cannot view versions of private draft decision (403)."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)

        # Bob (Employee) cannot view Alice's draft decision
        with self.assertRaises(HTTPException) as ctx:
            list_decision_versions(decision_id=decision.id, db=self.db, current_user=self.bob)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

        with self.assertRaises(HTTPException) as ctx:
            get_single_decision_version(decision_id=decision.id, version_id=1, db=self.db, current_user=self.bob)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

        with self.assertRaises(HTTPException) as ctx:
            compare_decision_versions(decision_id=decision.id, version_a=1, version_b=1, db=self.db, current_user=self.bob)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_19_changed_by_cannot_be_spoofed(self):
        """Test that changed_by strictly uses current_user.id from JWT context."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        # Verify initial changed_by is Alice
        v1 = get_single_decision_version(decision.id, 1, self.db, self.alice)
        self.assertEqual(v1.changed_by, self.alice.id)

        # Admin edits Alice's draft decision
        update_decision(self.db, decision.id, DecisionUpdateRequest(reasoning="Admin amended reasoning"), self.admin)
        v2 = get_single_decision_version(decision.id, 2, self.db, self.admin)
        self.assertEqual(v2.changed_by, self.admin.id)
        self.assertEqual(v2.changer.full_name, "Dave Admin")

    def test_20_cascade_deletion_on_decision_delete(self):
        """Test that deleting a decision cascades and deletes all historical versions."""
        decision = create_decision(self.db, self.initial_req, self.alice.id)
        update_decision(self.db, decision.id, DecisionUpdateRequest(title="Title v2"), self.alice)
        update_decision(self.db, decision.id, DecisionUpdateRequest(title="Title v3"), self.alice)

        self.assertEqual(self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision.id).count(), 3)

        # Delete decision
        delete_decision(self.db, decision.id, self.alice)

        # Versions must be cascade-deleted
        count_after = self.db.query(DecisionVersion).filter(DecisionVersion.decision_id == decision.id).count()
        self.assertEqual(count_after, 0)


if __name__ == "__main__":
    unittest.main()
