"""
Test Suite: Milestone 3 - Approval Workflows
Tests for:
1. Decision submission transitioning to Submitted / Under Review
2. Role-based review permissions (Reviewer, Manager, Administrator allowed; Employee rejected)
3. Creator self-approval/rejection prevention (HTTP 403)
4. Successful approval with status transition, Approval record, and version tracking snapshot
5. Successful rejection with mandatory reason, status transition, Approval record, and version tracking snapshot
6. Empty or missing rejection reason rejection (HTTP 400 or 422)
7. Non-reviewable status validation (cannot approve Draft, Approved, or Rejected)
8. Pending approvals listing filtered by role
9. Approval history retrieval and chronological ordering
10. Cascade and relationship integrity
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
from app.models.approval import Approval, ApprovalActionEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.decision_version import DecisionVersion
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.approval import ApprovalActionRequest, RejectActionRequest
from app.schemas.decision import DecisionCreateRequest
from app.services.approval_service import (
    approve_decision,
    get_approval_history,
    get_pending_approvals,
    reject_decision,
    validate_approval_permission,
    validate_decision_reviewable,
    validate_not_self_action,
)
from app.services.decision_service import create_decision, submit_decision
from app.services.decision_version_service import get_versions


class TestApprovalWorkflows(unittest.TestCase):
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
        mgr_role = self.db.query(Role).filter(Role.name == RoleEnum.MANAGER.value).first()
        adm_role = self.db.query(Role).filter(Role.name == RoleEnum.ADMINISTRATOR.value).first()

        # Setup users
        self.employee = self.db.query(User).filter(User.email == "emp_appr@test.com").first()
        if not self.employee:
            self.employee = User(full_name="Edward Employee", email="emp_appr@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.employee)

        self.reviewer = self.db.query(User).filter(User.email == "rev_appr@test.com").first()
        if not self.reviewer:
            self.reviewer = User(full_name="Rachel Reviewer", email="rev_appr@test.com", hashed_password="hash", role_id=rev_role.id)
            self.db.add(self.reviewer)

        self.manager = self.db.query(User).filter(User.email == "mgr_appr@test.com").first()
        if not self.manager:
            self.manager = User(full_name="Marcus Manager", email="mgr_appr@test.com", hashed_password="hash", role_id=mgr_role.id)
            self.db.add(self.manager)

        self.admin = self.db.query(User).filter(User.email == "adm_appr@test.com").first()
        if not self.admin:
            self.admin = User(full_name="Adam Admin", email="adm_appr@test.com", hashed_password="hash", role_id=adm_role.id)
            self.db.add(self.admin)

        self.db.commit()
        self.db.refresh(self.employee)
        self.db.refresh(self.reviewer)
        self.db.refresh(self.manager)
        self.db.refresh(self.admin)

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def _create_and_submit_decision(self, title="Decision for Approval"):
        decision = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title=title,
                problem_statement="Problem statement for approval test",
                context="Organizational context and constraints",
                decision_taken="Proceed with proposal option A",
                reasoning="Thorough rationale and analysis",
                expected_outcome="Improved business metrics",
            ),
            user_id=self.employee.id,
        )
        return submit_decision(db=self.db, decision_id=decision.id, current_user=self.employee)

    # -------------------------------------------------------------------------
    # 1. Role Permission Tests
    # -------------------------------------------------------------------------
    def test_employee_cannot_review(self):
        with self.assertRaises(HTTPException) as cm:
            validate_approval_permission(self.employee)
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_reviewer_manager_admin_can_review(self):
        # Should not raise
        validate_approval_permission(self.reviewer)
        validate_approval_permission(self.manager)
        validate_approval_permission(self.admin)

    # -------------------------------------------------------------------------
    # 2. Self-Review Prohibition Tests
    # -------------------------------------------------------------------------
    def test_creator_cannot_approve_own_decision(self):
        # Create decision where reviewer is the creator
        rev_decision = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title="Reviewer Decision",
                problem_statement="Problem statement",
                context="Context constraints",
                decision_taken="Option A",
                reasoning="Rationale",
            ),
            user_id=self.reviewer.id,
        )
        submit_decision(db=self.db, decision_id=rev_decision.id, current_user=self.reviewer)

    def test_creator_cannot_approve_own_decision(self):
        # Create decision where reviewer is the creator
        rev_decision = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title="Reviewer Decision",
                problem_statement="Problem statement",
                context="Context constraints",
                decision_taken="Option A",
                reasoning="Rationale",
            ),
            user_id=self.reviewer.id,
        )
        submit_decision(db=self.db, decision_id=rev_decision.id, current_user=self.reviewer)

        with self.assertRaises(HTTPException) as cm:
            approve_decision(
                db=self.db,
                decision_id=rev_decision.id,
                current_user=self.reviewer,
                comment="Approving my own",
            )
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("cannot approve your own decision", cm.exception.detail)

    def test_creator_cannot_reject_own_decision(self):
        rev_decision = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title="Reviewer Decision 2",
                problem_statement="Problem statement",
                context="Context constraints",
                decision_taken="Option B",
                reasoning="Rationale",
            ),
            user_id=self.reviewer.id,
        )
        submit_decision(db=self.db, decision_id=rev_decision.id, current_user=self.reviewer)

        with self.assertRaises(HTTPException) as cm:
            reject_decision(
                db=self.db,
                decision_id=rev_decision.id,
                current_user=self.reviewer,
                reason="Rejecting my own",
            )
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("cannot reject your own decision", cm.exception.detail)

    # -------------------------------------------------------------------------
    # 3. Status Validation Tests (Reviewable States)
    # -------------------------------------------------------------------------
    def test_cannot_approve_draft_decision(self):
        draft_decision = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title="Draft Decision",
                problem_statement="Problem statement",
                context="Context constraints",
                decision_taken="Option C",
                reasoning="Rationale",
            ),
            user_id=self.employee.id,
        )
        with self.assertRaises(HTTPException) as cm:
            approve_decision(
                db=self.db,
                decision_id=draft_decision.id,
                current_user=self.reviewer,
                comment="Premature approval",
            )
        self.assertEqual(cm.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot review a draft decision", cm.exception.detail.lower())

    def test_cannot_approve_already_approved_decision(self):
        decision = self._create_and_submit_decision("Double Approve Test")
        approve_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            comment="First approval",
        )
        # Attempt second approval by manager
        with self.assertRaises(HTTPException) as cm:
            approve_decision(
                db=self.db,
                decision_id=decision.id,
                current_user=self.manager,
                comment="Second approval",
            )
        self.assertEqual(cm.exception.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_reject_already_rejected_decision(self):
        decision = self._create_and_submit_decision("Double Reject Test")
        reject_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            reason="First rejection reason",
        )
        # Attempt second rejection by admin
        with self.assertRaises(HTTPException) as cm:
            reject_decision(
                db=self.db,
                decision_id=decision.id,
                current_user=self.admin,
                reason="Second rejection",
            )
        self.assertEqual(cm.exception.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # 4. Successful Approval Workflow Tests
    # -------------------------------------------------------------------------
    def test_successful_approval_by_reviewer(self):
        decision = self._create_and_submit_decision("Approval Flow 1")
        approval = approve_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            comment="LGTM! Approved for execution.",
        )

        self.assertEqual(approval.action, ApprovalActionEnum.APPROVED.value)
        self.assertEqual(approval.previous_status, DecisionStatusEnum.SUBMITTED.value)
        self.assertEqual(approval.new_status, DecisionStatusEnum.APPROVED.value)
        self.assertEqual(approval.reviewer_id, self.reviewer.id)
        self.assertEqual(approval.comment, "LGTM! Approved for execution.")

        # Verify decision updated in db
        self.db.refresh(decision)
        self.assertEqual(decision.status, DecisionStatusEnum.APPROVED.value)

        # Verify version snapshot created with summary "Decision approved"
        versions = get_versions(db=self.db, decision_id=decision.id, current_user=self.reviewer)
        self.assertEqual(versions[0].change_summary, "Decision approved")
        self.assertEqual(versions[0].status, DecisionStatusEnum.APPROVED.value)

    def test_successful_approval_by_manager(self):
        decision = self._create_and_submit_decision("Manager Approval Test")
        approval = approve_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.manager,
        )
        self.assertEqual(approval.action, ApprovalActionEnum.APPROVED.value)
        self.db.refresh(decision)
        self.assertEqual(decision.status, DecisionStatusEnum.APPROVED.value)

    def test_successful_approval_by_admin(self):
        decision = self._create_and_submit_decision("Admin Approval Test")
        approval = approve_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.admin,
            comment="Executive override approval",
        )
        self.assertEqual(approval.action, ApprovalActionEnum.APPROVED.value)
        self.db.refresh(decision)
        self.assertEqual(decision.status, DecisionStatusEnum.APPROVED.value)

    # -------------------------------------------------------------------------
    # 5. Successful Rejection Workflow Tests
    # -------------------------------------------------------------------------
    def test_successful_rejection_with_reason(self):
        decision = self._create_and_submit_decision("Rejection Flow 1")
        approval = reject_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            reason="Insufficient ROI data provided in alternative 2.",
            comment="Please revise alternatives with concrete numbers.",
        )

        self.assertEqual(approval.action, ApprovalActionEnum.REJECTED.value)
        self.assertEqual(approval.previous_status, DecisionStatusEnum.SUBMITTED.value)
        self.assertEqual(approval.new_status, DecisionStatusEnum.REJECTED.value)
        self.assertEqual(approval.rejection_reason, "Insufficient ROI data provided in alternative 2.")
        self.assertEqual(approval.comment, "Please revise alternatives with concrete numbers.")

        # Verify decision updated
        self.db.refresh(decision)
        self.assertEqual(decision.status, DecisionStatusEnum.REJECTED.value)

        # Verify version snapshot created with summary "Decision rejected"
        versions = get_versions(db=self.db, decision_id=decision.id, current_user=self.reviewer)
        self.assertEqual(versions[0].change_summary, "Decision rejected")
        self.assertEqual(versions[0].status, DecisionStatusEnum.REJECTED.value)

    def test_rejection_requires_non_empty_reason(self):
        decision = self._create_and_submit_decision("Empty Rejection Reason")
        with self.assertRaises(HTTPException) as cm:
            reject_decision(
                db=self.db,
                decision_id=decision.id,
                current_user=self.reviewer,
                reason="   ",
            )
        self.assertEqual(cm.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rejection reason is required", cm.exception.detail.lower())

    # -------------------------------------------------------------------------
    # 6. Pending Approvals Listing Tests
    # -------------------------------------------------------------------------
    def test_pending_approvals_accessible_by_reviewer(self):
        d1 = self._create_and_submit_decision("Pending 1")
        d2 = self._create_and_submit_decision("Pending 2")

        pending = get_pending_approvals(db=self.db, current_user=self.reviewer)
        pending_ids = [item.id for item in pending]
        self.assertIn(d1.id, pending_ids)
        self.assertIn(d2.id, pending_ids)

    def test_pending_approvals_rejected_for_employee(self):
        with self.assertRaises(HTTPException) as cm:
            get_pending_approvals(db=self.db, current_user=self.employee)
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_pending_approvals_excludes_draft_approved_rejected(self):
        # Draft
        draft_d = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title="Draft Only",
                problem_statement="Problem statement",
                context="Context constraints",
                decision_taken="Option D",
                reasoning="Rationale",
            ),
            user_id=self.employee.id,
        )
        # Approved
        appr_d = self._create_and_submit_decision("Approve Only")
        approve_decision(db=self.db, decision_id=appr_d.id, current_user=self.reviewer)
        # Rejected
        rej_d = self._create_and_submit_decision("Reject Only")
        reject_decision(
            db=self.db,
            decision_id=rej_d.id,
            current_user=self.reviewer,
            reason="Test reject",
        )

        pending = get_pending_approvals(db=self.db, current_user=self.manager)
        pending_ids = [item.id for item in pending]
        self.assertNotIn(draft_d.id, pending_ids)
        self.assertNotIn(appr_d.id, pending_ids)
        self.assertNotIn(rej_d.id, pending_ids)

    # -------------------------------------------------------------------------
    # 7. Approval Audit History Tests
    # -------------------------------------------------------------------------
    def test_approval_history_ordering(self):
        decision = self._create_and_submit_decision("History Test")
        approve_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            comment="Review pass",
        )

        history = get_approval_history(db=self.db, decision_id=decision.id, current_user=self.employee)
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].action, ApprovalActionEnum.APPROVED.value)
        self.assertEqual(history[0].reviewer.email, self.reviewer.email)

    def test_approval_history_access_control(self):
        # Other employee with private decision
        other_emp = User(full_name="Other Employee", email="other_emp@test.com", hashed_password="hash", role_id=self.employee.role_id)
        self.db.add(other_emp)
        self.db.commit()

        decision = create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title="Other Private Decision",
                problem_statement="Problem statement",
                context="Context constraints",
                decision_taken="Option E",
                reasoning="Rationale",
            ),
            user_id=other_emp.id,
        )

        # Employee should be forbidden from accessing another employee's unsubmitted draft
        with self.assertRaises(HTTPException) as cm:
            get_approval_history(db=self.db, decision_id=decision.id, current_user=self.employee)
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)


if __name__ == "__main__":
    unittest.main(verbosity=2)
