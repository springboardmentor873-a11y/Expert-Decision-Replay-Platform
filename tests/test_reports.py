"""
Test Suite: Milestone 3 - Reports & Reporting Module
Covers comprehensive verification for all 6 report types, RBAC visibility,
filtering, aggregations, CSV exports, and cross-dialect consistency.
"""

import os
import sys
import unittest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException, status

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.alternative import Alternative
from app.models.approval import Approval, ApprovalActionEnum
from app.models.audit_log import AuditLog, AuditActionEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services import report_service


class TestReportsModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create SQLite in-memory engine and sessionmaker
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.Session = sessionmaker(bind=cls.engine)
        Base.metadata.create_all(cls.engine)

    def setUp(self):
        # Clean database tables before each test
        self.db = self.Session()
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()

        # Seed standard roles
        self.role_employee = Role(id=1, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.role_reviewer = Role(id=2, name=RoleEnum.REVIEWER.value, description="Reviewer")
        self.role_manager = Role(id=3, name=RoleEnum.MANAGER.value, description="Manager")
        self.role_admin = Role(id=4, name=RoleEnum.ADMINISTRATOR.value, description="Admin")
        self.db.add_all([self.role_employee, self.role_reviewer, self.role_manager, self.role_admin])
        self.db.commit()

        # Seed standard users
        self.alice_emp = User(
            id=1,
            full_name="Alice Employee",
            email="alice@example.com",
            hashed_password="hashed_pw_1",
            role_id=1,
            is_active=True,
        )
        self.bob_emp = User(
            id=2,
            full_name="Bob Employee",
            email="bob@example.com",
            hashed_password="hashed_pw_2",
            role_id=1,
            is_active=True,
        )
        self.carol_rev = User(
            id=3,
            full_name="Carol Reviewer",
            email="carol@example.com",
            hashed_password="hashed_pw_3",
            role_id=2,
            is_active=True,
        )
        self.dave_mgr = User(
            id=4,
            full_name="Dave Manager",
            email="dave@example.com",
            hashed_password="hashed_pw_4",
            role_id=3,
            is_active=True,
        )
        self.eve_admin = User(
            id=5,
            full_name="Eve Admin",
            email="eve@example.com",
            hashed_password="hashed_pw_5",
            role_id=4,
            is_active=True,
        )
        self.db.add_all([self.alice_emp, self.bob_emp, self.carol_rev, self.dave_mgr, self.eve_admin])
        self.db.commit()

        # Refresh with role relationships loaded
        self.alice_emp = self.db.query(User).filter_by(id=1).first()
        self.bob_emp = self.db.query(User).filter_by(id=2).first()
        self.carol_rev = self.db.query(User).filter_by(id=3).first()
        self.dave_mgr = self.db.query(User).filter_by(id=4).first()
        self.eve_admin = self.db.query(User).filter_by(id=5).first()

    def tearDown(self):
        self.db.close()

    def _seed_sample_dataset(self):
        """Helper to seed decisions, alternatives, approvals, and audit logs."""
        now = datetime.utcnow()
        # Decision 1: Alice's Draft
        d1 = Decision(
            id=1,
            title="Alice Draft Platform",
            problem_statement="Alice initial problem statement",
            context="Architecture evaluation context",
            decision_taken="Adopt microservices approach",
            reasoning="Increases scalability across teams",
            status=DecisionStatusEnum.DRAFT.value,
            created_by=self.alice_emp.id,
            created_at=now - timedelta(days=5),
            expected_outcome="Reduce latency by 20%",
            actual_outcome=None,
        )
        # Decision 2: Alice's Approved Decision
        d2 = Decision(
            id=2,
            title="Alice Microservices Strategy",
            problem_statement="Monolith scalability bottlenecks",
            context="Production cloud infrastructure",
            decision_taken="Break into microservices",
            reasoning="Independent deployment cycles",
            status=DecisionStatusEnum.APPROVED.value,
            created_by=self.alice_emp.id,
            created_at=now - timedelta(days=4),
            expected_outcome="Better horizontal scaling",
            actual_outcome="Successfully deployed with 99.99% uptime",
        )
        # Decision 3: Bob's Draft (must be invisible to Alice, Carol, Dave)
        d3 = Decision(
            id=3,
            title="Bob Private Project",
            problem_statement="Manual billing overhead",
            context="Internal tooling",
            decision_taken="Automate invoicing script",
            reasoning="Saves accounting hours",
            status=DecisionStatusEnum.DRAFT.value,
            created_by=self.bob_emp.id,
            created_at=now - timedelta(days=3),
            expected_outcome="Automate billing",
            actual_outcome=None,
        )
        # Decision 4: Bob's Submitted Decision
        d4 = Decision(
            id=4,
            title="Bob Cloud DB Migration",
            problem_statement="Database storage limits reached",
            context="Database tier",
            decision_taken="Migrate to cloud PostgreSQL",
            reasoning="Better concurrency and managed backups",
            status=DecisionStatusEnum.SUBMITTED.value,
            created_by=self.bob_emp.id,
            created_at=now - timedelta(days=2),
            expected_outcome="Increase throughput 3x",
            actual_outcome=None,
        )
        # Decision 5: Bob's Rejected Decision
        d5 = Decision(
            id=5,
            title="Bob Legacy Tool",
            problem_statement="Old legacy tool is slow",
            context="Legacy systems",
            decision_taken="In-place binary patch",
            reasoning="Quickest approach",
            status=DecisionStatusEnum.REJECTED.value,
            created_by=self.bob_emp.id,
            created_at=now - timedelta(days=1),
            expected_outcome="Low risk update",
            actual_outcome="Failed migration, rollback required",
        )
        self.db.add_all([d1, d2, d3, d4, d5])
        self.db.commit()

        # Alternatives
        alt1 = Alternative(
            id=1,
            decision_id=2,
            name="Kubernetes Deployment",
            description="Use K8s clusters",
            pros="Highly scalable, resilient",
            cons="Complex cluster maintenance",
            cost="Medium",
            feasibility="High",
            risk_assessment="Low risk with managed EKS",
            is_selected=True,
            created_at=now - timedelta(days=4),
        )
        alt2 = Alternative(
            id=2,
            decision_id=2,
            name="Serverless ECS",
            description="Use AWS Fargate",
            pros="Zero server management",
            cons="Higher network latency spikes",
            cost="High",
            feasibility="Medium",
            risk_assessment="Moderate cost variance",
            is_selected=False,
            created_at=now - timedelta(days=4),
        )
        alt3 = Alternative(
            id=3,
            decision_id=3,
            name="Bob Secret Alt",
            description="Alternative in Bob's draft",
            pros="Fast",
            cons="Risky",
            cost="Low",
            feasibility="Low",
            risk_assessment="High risk",
            is_selected=False,
            created_at=now - timedelta(days=3),
        )
        alt4 = Alternative(
            id=4,
            decision_id=4,
            name="AWS Aurora PostgreSQL",
            description="Aurora Serverless v2",
            pros="Instant autoscaling",
            cons="Vendor lock-in",
            cost="Medium",
            feasibility="High",
            risk_assessment="Low risk",
            is_selected=True,
            created_at=now - timedelta(days=2),
        )
        self.db.add_all([alt1, alt2, alt3, alt4])
        self.db.commit()

        # Approvals
        app1 = Approval(
            id=1,
            decision_id=2,
            reviewer_id=self.carol_rev.id,
            action=ApprovalActionEnum.APPROVED.value,
            previous_status=DecisionStatusEnum.SUBMITTED.value,
            new_status=DecisionStatusEnum.APPROVED.value,
            comment="Excellent architecture document",
            created_at=now - timedelta(days=3),
        )
        app2 = Approval(
            id=2,
            decision_id=5,
            reviewer_id=self.dave_mgr.id,
            action=ApprovalActionEnum.REJECTED.value,
            previous_status=DecisionStatusEnum.SUBMITTED.value,
            new_status=DecisionStatusEnum.REJECTED.value,
            rejection_reason="Insufficient fallback strategy and risk mitigation",
            comment="Please revise and resubmit",
            created_at=now - timedelta(hours=12),
        )
        self.db.add_all([app1, app2])
        self.db.commit()

        # Audit logs
        log1 = AuditLog(
            id=1,
            user_id=self.alice_emp.id,
            action=AuditActionEnum.DECISION_CREATED.value,
            entity_type="Decision",
            entity_id=2,
            description="Created decision 'Alice Microservices Strategy'",
            details={"decision_id": 2},
            created_at=now - timedelta(days=4),
        )
        log2 = AuditLog(
            id=2,
            user_id=self.alice_emp.id,
            action=AuditActionEnum.ALTERNATIVE_CREATED.value,
            entity_type="Alternative",
            entity_id=1,
            description="Added alternative 'Kubernetes Deployment' to decision #2",
            details={"decision_id": 2, "alternative_id": 1},
            created_at=now - timedelta(days=4, hours=-1),
        )
        log3 = AuditLog(
            id=3,
            user_id=self.alice_emp.id,
            action=AuditActionEnum.DECISION_SUBMITTED.value,
            entity_type="Decision",
            entity_id=2,
            description="Submitted decision 'Alice Microservices Strategy' for review",
            details={"decision_id": 2},
            created_at=now - timedelta(days=3, hours=2),
        )
        log4 = AuditLog(
            id=4,
            user_id=self.carol_rev.id,
            action=AuditActionEnum.DECISION_APPROVED.value,
            entity_type="Decision",
            entity_id=2,
            description="Approved decision 'Alice Microservices Strategy'",
            details={"decision_id": 2},
            created_at=now - timedelta(days=3),
        )
        log5 = AuditLog(
            id=5,
            user_id=self.bob_emp.id,
            action=AuditActionEnum.DECISION_CREATED.value,
            entity_type="Decision",
            entity_id=3,
            description="Created private draft",
            details={"decision_id": 3},
            created_at=now - timedelta(days=3),
        )
        self.db.add_all([log1, log2, log3, log4, log5])
        self.db.commit()

    # ------------------------------------------------------------------
    # 1. Decision Summary Report Tests
    # ------------------------------------------------------------------
    def test_01_summary_report_admin_sees_all_statuses(self):
        self._seed_sample_dataset()
        res = report_service.get_decision_summary_report(self.db, current_user=self.eve_admin)

        self.assertEqual(res["total_decisions"], 5)
        self.assertEqual(res["draft"], 2)  # d1, d3
        self.assertEqual(res["submitted"], 1)  # d4
        self.assertEqual(res["approved"], 1)  # d2
        self.assertEqual(res["rejected"], 1)  # d5
        self.assertEqual(res["under_review"], 0)

    def test_02_summary_report_employee_only_sees_own(self):
        self._seed_sample_dataset()
        res = report_service.get_decision_summary_report(self.db, current_user=self.alice_emp)

        # Alice owns d1 (draft) and d2 (approved) -> total 2
        self.assertEqual(res["total_decisions"], 2)
        self.assertEqual(res["draft"], 1)
        self.assertEqual(res["approved"], 1)
        self.assertEqual(res["submitted"], 0)
        self.assertEqual(res["rejected"], 0)

    def test_03_summary_report_reviewer_manager_sees_own_and_nondraft(self):
        self._seed_sample_dataset()
        res = report_service.get_decision_summary_report(self.db, current_user=self.carol_rev)

        # Carol sees: d2 (Approved), d4 (Submitted), d5 (Rejected) = 3 total (d1 and d3 are drafts of others)
        self.assertEqual(res["total_decisions"], 3)
        self.assertEqual(res["draft"], 0)
        self.assertEqual(res["approved"], 1)
        self.assertEqual(res["submitted"], 1)
        self.assertEqual(res["rejected"], 1)

    def test_04_summary_report_status_percentages_and_distribution(self):
        self._seed_sample_dataset()
        res = report_service.get_decision_summary_report(self.db, current_user=self.eve_admin)

        # Total is 5: draft=2 (40%), submitted=1 (20%), approved=1 (20%), rejected=1 (20%)
        self.assertEqual(res["status_percentages"]["Draft"], 40.0)
        self.assertEqual(res["status_percentages"]["Submitted"], 20.0)
        self.assertEqual(res["status_percentages"]["Approved"], 20.0)
        self.assertEqual(res["status_percentages"]["Rejected"], 20.0)

        # Distribution array has 5 status entries
        self.assertEqual(len(res["status_distribution"]), 5)

    def test_05_summary_report_date_filtering(self):
        self._seed_sample_dataset()
        now = datetime.utcnow()
        # Filter decisions created within the last 36 hours (only d5 was created within 1 day)
        start = now - timedelta(hours=36)
        res = report_service.get_decision_summary_report(self.db, current_user=self.eve_admin, start_date=start)

        self.assertEqual(res["total_decisions"], 1)
        self.assertEqual(res["rejected"], 1)

    def test_06_summary_report_title_and_creator_filter(self):
        self._seed_sample_dataset()
        res = report_service.get_decision_summary_report(
            self.db, current_user=self.eve_admin, title_search="Microservices"
        )
        self.assertEqual(res["total_decisions"], 1)
        self.assertEqual(res["approved"], 1)

        res_creator = report_service.get_decision_summary_report(
            self.db, current_user=self.eve_admin, created_by=self.bob_emp.id
        )
        self.assertEqual(res_creator["total_decisions"], 3)  # d3, d4, d5

    # ------------------------------------------------------------------
    # 2. Approval Report Tests
    # ------------------------------------------------------------------
    def test_07_approval_report_aggregates_and_rates(self):
        self._seed_sample_dataset()
        res = report_service.get_approval_report(self.db, current_user=self.eve_admin)

        self.assertEqual(res["total_reviews"], 2)
        self.assertEqual(res["approved_count"], 1)
        self.assertEqual(res["rejected_count"], 1)
        self.assertEqual(res["pending_approvals"], 1)  # d4 is in Submitted
        self.assertEqual(res["approval_rate"], 50.0)
        self.assertEqual(res["rejection_rate"], 50.0)
        self.assertEqual(len(res["items"]), 2)

    def test_08_approval_report_filter_by_action(self):
        self._seed_sample_dataset()
        res_app = report_service.get_approval_report(self.db, current_user=self.eve_admin, action_filter="APPROVED")
        self.assertEqual(res_app["total_reviews"], 1)
        self.assertEqual(res_app["items"][0]["action"], "APPROVED")
        self.assertEqual(res_app["approval_rate"], 100.0)

        res_rej = report_service.get_approval_report(self.db, current_user=self.eve_admin, action_filter="REJECTED")
        self.assertEqual(res_rej["total_reviews"], 1)
        self.assertEqual(res_rej["items"][0]["action"], "REJECTED")
        self.assertEqual(res_rej["rejection_rate"], 100.0)

    def test_09_approval_report_rbac_visibility(self):
        self._seed_sample_dataset()
        # Alice only has access to d1 and d2. Approval on d5 (Bob's rejected decision) should NOT be in Alice's items
        res_alice = report_service.get_approval_report(self.db, current_user=self.alice_emp)
        self.assertEqual(res_alice["total_reviews"], 1)
        self.assertEqual(res_alice["items"][0]["decision_id"], 2)

    def test_10_approval_report_pagination(self):
        self._seed_sample_dataset()
        res = report_service.get_approval_report(self.db, current_user=self.eve_admin, page=1, page_size=1)
        self.assertEqual(res["total_reviews"], 2)
        self.assertEqual(len(res["items"]), 1)
        self.assertEqual(res["pages"], 2)
        self.assertEqual(res["page"], 1)

    # ------------------------------------------------------------------
    # 3. Decision Outcome Report Tests
    # ------------------------------------------------------------------
    def test_11_outcome_report_recorded_vs_not_recorded(self):
        self._seed_sample_dataset()
        res = report_service.get_outcome_report(self.db, current_user=self.eve_admin)

        # In sample: d2 has actual outcome, d5 has actual outcome -> 2 recorded. d1, d3, d4 have None -> 3 not recorded
        self.assertEqual(res["total_decisions"], 5)
        self.assertEqual(res["recorded_count"], 2)
        self.assertEqual(res["not_recorded_count"], 3)
        self.assertEqual(res["recorded_percentage"], 40.0)
        self.assertEqual(len(res["items"]), 5)

    def test_12_outcome_report_filter_by_outcome_status(self):
        self._seed_sample_dataset()
        res_rec = report_service.get_outcome_report(self.db, current_user=self.eve_admin, outcome_status="recorded")
        self.assertEqual(res_rec["total"], 2)
        for it in res_rec["items"]:
            self.assertTrue(it["outcome_recorded"])
            self.assertIsNotNone(it["actual_outcome"])

        res_not_rec = report_service.get_outcome_report(self.db, current_user=self.eve_admin, outcome_status="not_recorded")
        self.assertEqual(res_not_rec["total"], 3)
        for it in res_not_rec["items"]:
            self.assertFalse(it["outcome_recorded"])

    def test_13_outcome_report_rbac_isolation(self):
        self._seed_sample_dataset()
        # Alice only sees d1 and d2
        res_alice = report_service.get_outcome_report(self.db, current_user=self.alice_emp)
        self.assertEqual(res_alice["total_decisions"], 2)
        self.assertEqual(res_alice["recorded_count"], 1)  # d2
        self.assertEqual(res_alice["not_recorded_count"], 1)  # d1
        self.assertEqual(res_alice["recorded_percentage"], 50.0)

    # ------------------------------------------------------------------
    # 4. Alternative Report Tests
    # ------------------------------------------------------------------
    def test_14_alternative_report_aggregates(self):
        self._seed_sample_dataset()
        res = report_service.get_alternative_report(self.db, current_user=self.eve_admin)

        self.assertEqual(res["total_alternatives"], 4)
        self.assertEqual(res["total_decisions_analyzed"], 3)  # d2, d3, d4
        self.assertEqual(res["selected_alternatives_count"], 2)  # alt1, alt4
        self.assertEqual(res["avg_alternatives_per_decision"], 1.33)
        self.assertIn("High", res["feasibility_distribution"])

    def test_15_alternative_report_selected_and_feasibility_filters(self):
        self._seed_sample_dataset()
        res_sel = report_service.get_alternative_report(self.db, current_user=self.eve_admin, is_selected=True)
        self.assertEqual(res_sel["total_alternatives"], 2)
        for alt in res_sel["items"]:
            self.assertTrue(alt["is_selected"])

        res_feas = report_service.get_alternative_report(self.db, current_user=self.eve_admin, feasibility="High")
        self.assertEqual(res_feas["total_alternatives"], 2)
        for alt in res_feas["items"]:
            self.assertEqual(alt["feasibility"], "High")

    def test_16_alternative_report_rbac_isolation(self):
        self._seed_sample_dataset()
        # Alice cannot see alt3 (which belongs to Bob's draft d3) or alt4 (Bob's d4)
        # Alice only sees alt1 and alt2
        res_alice = report_service.get_alternative_report(self.db, current_user=self.alice_emp)
        self.assertEqual(res_alice["total_alternatives"], 2)
        for it in res_alice["items"]:
            self.assertEqual(it["decision_id"], 2)

    # ------------------------------------------------------------------
    # 5. Activity Report Tests
    # ------------------------------------------------------------------
    def test_17_activity_report_stream_and_counts(self):
        self._seed_sample_dataset()
        res = report_service.get_activity_report(self.db, current_user=self.eve_admin)

        self.assertEqual(res["total_activities"], 5)
        self.assertEqual(len(res["items"]), 5)
        self.assertIn("DECISION_CREATED", res["action_counts"])
        self.assertIn("DECISION_APPROVED", res["action_counts"])

    def test_18_activity_report_rbac_employee_restricted(self):
        self._seed_sample_dataset()
        # Alice only sees activity on her decisions or by her
        res_alice = report_service.get_activity_report(self.db, current_user=self.alice_emp)
        # Should not include log5 (Bob's private draft)
        log_ids = [it["id"] for it in res_alice["items"]]
        self.assertNotIn(5, log_ids)

    def test_19_activity_report_filter_by_decision(self):
        self._seed_sample_dataset()
        res_d2 = report_service.get_activity_report(self.db, current_user=self.eve_admin, decision_id=2)
        # log1, log2, log3, log4 are for decision #2
        self.assertEqual(res_d2["total"], 4)
        for it in res_d2["items"]:
            self.assertEqual(it["decision_id"], 2)

    # ------------------------------------------------------------------
    # 6. Decision Timeline Report Tests
    # ------------------------------------------------------------------
    def test_20_decision_timeline_reconstruction(self):
        self._seed_sample_dataset()
        res = report_service.get_decision_timeline(self.db, decision_id=2, current_user=self.alice_emp)

        self.assertEqual(res["decision_id"], 2)
        self.assertEqual(res["title"], "Alice Microservices Strategy")
        self.assertGreaterEqual(len(res["events"]), 4)

        stages = [e["stage"] for e in res["events"]]
        self.assertIn("Creation", stages)
        self.assertIn("Alternatives", stages)
        self.assertIn("Submission", stages)
        self.assertIn("Review", stages)

        # Check chronological ordering
        timestamps = [e["timestamp"] for e in res["events"]]
        self.assertEqual(timestamps, sorted(timestamps))

    def test_21_decision_timeline_forbidden_on_unauthorized_draft(self):
        self._seed_sample_dataset()
        # Alice tries to get timeline for Bob's draft (decision #3)
        with self.assertRaises(HTTPException) as ctx:
            report_service.get_decision_timeline(self.db, decision_id=3, current_user=self.alice_emp)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_22_decision_timeline_not_found(self):
        with self.assertRaises(HTTPException) as ctx:
            report_service.get_decision_timeline(self.db, decision_id=99999, current_user=self.eve_admin)
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # 7. CSV Export Tests
    # ------------------------------------------------------------------
    def test_23_csv_export_summary(self):
        self._seed_sample_dataset()
        data = report_service.get_decision_summary_report(self.db, current_user=self.eve_admin)
        csv_str = report_service.export_report_to_csv("summary", data)
        self.assertIn("Decision Summary Report", csv_str)
        self.assertIn("Total Decisions,5,100.0%", csv_str)

    def test_24_csv_export_approvals_and_outcomes(self):
        self._seed_sample_dataset()
        app_data = report_service.get_approval_report(self.db, current_user=self.eve_admin)
        csv_app = report_service.export_report_to_csv("approvals", app_data)
        self.assertIn("Approval ID,Decision ID", csv_app)
        self.assertIn("APPROVED", csv_app)

        out_data = report_service.get_outcome_report(self.db, current_user=self.eve_admin)
        csv_out = report_service.export_report_to_csv("outcomes", out_data)
        self.assertIn("Outcome Recorded", csv_out)
        self.assertIn("Alice Microservices Strategy", csv_out)

    def test_25_csv_export_alternatives_and_timeline(self):
        self._seed_sample_dataset()
        alt_data = report_service.get_alternative_report(self.db, current_user=self.eve_admin)
        csv_alt = report_service.export_report_to_csv("alternatives", alt_data)
        self.assertIn("Alternative Name,Description", csv_alt)
        self.assertIn("Kubernetes Deployment", csv_alt)

        time_data = report_service.get_decision_timeline(self.db, decision_id=2, current_user=self.eve_admin)
        csv_time = report_service.export_report_to_csv("timeline", time_data)
        self.assertIn("Timeline Report for Decision,#2", csv_time)
        self.assertIn("Creation", csv_time)

    # ------------------------------------------------------------------
    # 8. Empty Database Resilience
    # ------------------------------------------------------------------
    def test_26_empty_database_reports_graceful_defaults(self):
        # With zero decisions in DB
        res_summary = report_service.get_decision_summary_report(self.db, current_user=self.eve_admin)
        self.assertEqual(res_summary["total_decisions"], 0)
        self.assertEqual(res_summary["draft"], 0)
        self.assertEqual(res_summary["status_percentages"]["Draft"], 0.0)

        res_app = report_service.get_approval_report(self.db, current_user=self.eve_admin)
        self.assertEqual(res_app["total_reviews"], 0)
        self.assertEqual(res_app["approval_rate"], 0.0)

        res_out = report_service.get_outcome_report(self.db, current_user=self.eve_admin)
        self.assertEqual(res_out["total_decisions"], 0)
        self.assertEqual(res_out["recorded_percentage"], 0.0)

        res_alt = report_service.get_alternative_report(self.db, current_user=self.eve_admin)
        self.assertEqual(res_alt["total_alternatives"], 0)
        self.assertEqual(res_alt["avg_alternatives_per_decision"], 0.0)

        res_act = report_service.get_activity_report(self.db, current_user=self.eve_admin)
        self.assertEqual(res_act["total_activities"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
