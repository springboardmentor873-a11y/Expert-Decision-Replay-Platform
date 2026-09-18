import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.decision import Decision, DecisionStatusEnum
from app.schemas.decision import DecisionCreateRequest
from app.schemas.approval_workflow import (
    ApprovalWorkflowCreateRequest,
    ApprovalStepCreate,
    ApprovalStepActionRequest,
)
from app.services.decision_service import create_decision
from app.services.approval_workflow_service import (
    create_approval_workflow,
    get_workflows_for_decision,
    act_on_step,
    escalate_workflow,
)


class TestApprovalWorkflows(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.admin_role = Role(id=1, name=RoleEnum.ADMINISTRATOR.value, description="Admin")
        self.rev_role = Role(id=2, name=RoleEnum.REVIEWER.value, description="Reviewer")
        self.emp_role = Role(id=3, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.db.add_all([self.admin_role, self.rev_role, self.emp_role])
        self.db.commit()

        self.admin_user = User(
            id=1, email="admin@test.com", full_name="Admin User",
            hashed_password="hashed_password", role_id=1, is_active=True,
        )
        self.creator_user = User(
            id=2, email="creator@test.com", full_name="Creator User",
            hashed_password="hashed_password", role_id=3, is_active=True,
        )
        self.rev1 = User(
            id=3, email="rev1@test.com", full_name="Reviewer One",
            hashed_password="hashed_password", role_id=2, is_active=True,
        )
        self.rev2 = User(
            id=4, email="rev2@test.com", full_name="Reviewer Two",
            hashed_password="hashed_password", role_id=2, is_active=True,
        )
        self.db.add_all([self.admin_user, self.creator_user, self.rev1, self.rev2])
        self.db.commit()

        dec_in = DecisionCreateRequest(
            title="Kubernetes Cluster Upgrade",
            problem_statement="Upgrade cluster from 1.28 to 1.30",
            context="EKS managed cluster in Production",
            decision_taken="Gradual rolling node-group upgrade",
            reasoning="Ensures zero-downtime service continuity",
        )
        self.decision = create_decision(self.db, dec_in, self.creator_user.id)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_self_review_prevention(self):
        wf_in = ApprovalWorkflowCreateRequest(
            name="Production Release Approval",
            steps=[
                ApprovalStepCreate(step_number=1, reviewer_id=self.creator_user.id)
            ]
        )
        with self.assertRaises(HTTPException) as ctx:
            create_approval_workflow(self.db, self.decision.id, wf_in, self.creator_user)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("self-review", ctx.exception.detail.lower())

    def test_sequential_approval_progression(self):
        wf_in = ApprovalWorkflowCreateRequest(
            name="2-Tier Approval Workflow",
            steps=[
                ApprovalStepCreate(step_number=1, reviewer_id=self.rev1.id),
                ApprovalStepCreate(step_number=2, reviewer_id=self.rev2.id),
            ]
        )
        wf = create_approval_workflow(self.db, self.decision.id, wf_in, self.creator_user)
        self.assertEqual(wf["status"], "Pending")
        self.assertEqual(len(wf["steps"]), 2)

        step1 = wf["steps"][0]
        step2 = wf["steps"][1]

        # Reviewer 2 attempts to approve step 2 before step 1 -> blocked
        with self.assertRaises(HTTPException) as ctx:
            act_on_step(
                self.db,
                wf["id"],
                step2["id"],
                ApprovalStepActionRequest(action="Approved", comments="Premature approval"),
                self.rev2
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("prior step", ctx.exception.detail.lower())

        # Reviewer 1 approves Step 1
        res1 = act_on_step(
            self.db,
            wf["id"],
            step1["id"],
            ApprovalStepActionRequest(action="Approved", comments="Level 1 looks solid"),
            self.rev1
        )
        self.assertEqual(res1["steps"][0]["status"], "Approved")
        self.assertEqual(res1["status"], "Pending")  # Still pending step 2

        # Reviewer 2 approves Step 2
        res2 = act_on_step(
            self.db,
            wf["id"],
            step2["id"],
            ApprovalStepActionRequest(action="Approved", comments="Level 2 certified"),
            self.rev2
        )
        self.assertEqual(res2["steps"][1]["status"], "Approved")
        self.assertEqual(res2["status"], "Approved")

        # Verify decision is now Approved
        self.db.refresh(self.decision)
        self.assertEqual(self.decision.status, DecisionStatusEnum.APPROVED.value)

    def test_rejection_marks_workflow_and_decision_rejected(self):
        wf_in = ApprovalWorkflowCreateRequest(
            name="Workflow to Reject",
            steps=[
                ApprovalStepCreate(step_number=1, reviewer_id=self.rev1.id),
                ApprovalStepCreate(step_number=2, reviewer_id=self.rev2.id),
            ]
        )
        wf = create_approval_workflow(self.db, self.decision.id, wf_in, self.creator_user)
        step1 = wf["steps"][0]

        res = act_on_step(
            self.db,
            wf["id"],
            step1["id"],
            ApprovalStepActionRequest(action="Rejected", comments="Security requirements unmet"),
            self.rev1
        )
        self.assertEqual(res["status"], "Rejected")
        self.assertEqual(res["steps"][0]["status"], "Rejected")
        self.assertEqual(res["steps"][1]["status"], "Skipped")

        self.db.refresh(self.decision)
        self.assertEqual(self.decision.status, DecisionStatusEnum.REJECTED.value)

    def test_overdue_escalation(self):
        past_date = datetime.now(timezone.utc) - timedelta(days=3)
        wf_in = ApprovalWorkflowCreateRequest(
            name="Overdue Workflow",
            steps=[
                ApprovalStepCreate(step_number=1, reviewer_id=self.rev1.id, due_date=past_date)
            ]
        )
        wf = create_approval_workflow(self.db, self.decision.id, wf_in, self.creator_user)
        self.assertTrue(wf["steps"][0]["is_overdue"])

        escalation_result = escalate_workflow(self.db, wf["id"], self.admin_user)
        self.assertEqual(escalation_result["escalated_steps_count"], 1)


if __name__ == "__main__":
    unittest.main()
