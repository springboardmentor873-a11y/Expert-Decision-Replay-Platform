"""
Test Suite: Milestone 3 - Enterprise Dashboard Module
Comprehensive verification covering all 25+ criteria:
- Authentication & RBAC scoping (Employee, Reviewer, Manager, Administrator)
- KPI metrics (total, pending, approved, rejected, draft, my_decisions, activity, unread notifications)
- Real status distribution and time-based decision trend
- Approval performance and average turnaround time
- Recent decisions, pending review items, audit activity, discussions, documents, and notifications
- Strict data isolation and consistency with Reports module
"""

import os
import sys
import unittest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.approval import Approval, ApprovalActionEnum
from app.models.audit_log import AuditLog, AuditActionEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.discussion import Discussion
from app.models.document import Document
from app.models.notification import Notification
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services import dashboard_service, report_service


class TestDashboardModule(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.Session = sessionmaker(bind=cls.engine)
        Base.metadata.create_all(cls.engine)

    def setUp(self):
        self.db = self.Session()
        for table in reversed(Base.metadata.sorted_tables):
            self.db.execute(table.delete())
        self.db.commit()

        # Seed Roles
        self.role_employee = Role(id=1, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.role_reviewer = Role(id=2, name=RoleEnum.REVIEWER.value, description="Reviewer")
        self.role_manager = Role(id=3, name=RoleEnum.MANAGER.value, description="Manager")
        self.role_admin = Role(id=4, name=RoleEnum.ADMINISTRATOR.value, description="Admin")
        self.db.add_all([self.role_employee, self.role_reviewer, self.role_manager, self.role_admin])
        self.db.commit()

        # Seed Users
        self.alice_emp = User(
            id=1, full_name="Alice Employee", email="alice@example.com",
            hashed_password="hashed_pw_1", role_id=1, is_active=True
        )
        self.bob_emp = User(
            id=2, full_name="Bob Employee", email="bob@example.com",
            hashed_password="hashed_pw_2", role_id=1, is_active=True
        )
        self.carol_rev = User(
            id=3, full_name="Carol Reviewer", email="carol@example.com",
            hashed_password="hashed_pw_3", role_id=2, is_active=True
        )
        self.dave_mgr = User(
            id=4, full_name="Dave Manager", email="dave@example.com",
            hashed_password="hashed_pw_4", role_id=3, is_active=True
        )
        self.eve_admin = User(
            id=5, full_name="Eve Admin", email="eve@example.com",
            hashed_password="hashed_pw_5", role_id=4, is_active=True
        )
        self.db.add_all([self.alice_emp, self.bob_emp, self.carol_rev, self.dave_mgr, self.eve_admin])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def _seed_sample_data(self):
        """Helper to populate realistic multi-user platform data."""
        now = datetime.now(timezone.utc)

        # Decisions
        # Alice (Employee): 1 Draft, 1 Submitted, 1 Approved
        self.d1 = Decision(
            id=1, title="Alice Draft Decision", problem_statement="Draft problem",
            context="Ctx", decision_taken="Dec", reasoning="Reason",
            status=DecisionStatusEnum.DRAFT.value, created_by=self.alice_emp.id,
            created_at=now - timedelta(days=5), updated_at=now - timedelta(days=5)
        )
        self.d2 = Decision(
            id=2, title="Alice Submitted Decision", problem_statement="Sub problem",
            context="Ctx", decision_taken="Dec", reasoning="Reason",
            status=DecisionStatusEnum.SUBMITTED.value, created_by=self.alice_emp.id,
            created_at=now - timedelta(days=3), updated_at=now - timedelta(days=3)
        )
        self.d3 = Decision(
            id=3, title="Alice Approved Decision", problem_statement="App problem",
            context="Ctx", decision_taken="Dec", reasoning="Reason",
            status=DecisionStatusEnum.APPROVED.value, created_by=self.alice_emp.id,
            created_at=now - timedelta(days=2), updated_at=now - timedelta(days=1)
        )

        # Bob (Employee): 1 Draft (private), 1 Under Review, 1 Rejected
        self.d4 = Decision(
            id=4, title="Bob Secret Draft", problem_statement="Secret",
            context="Ctx", decision_taken="Dec", reasoning="Reason",
            status=DecisionStatusEnum.DRAFT.value, created_by=self.bob_emp.id,
            created_at=now - timedelta(days=4), updated_at=now - timedelta(days=4)
        )
        self.d5 = Decision(
            id=5, title="Bob Under Review Decision", problem_statement="Review problem",
            context="Ctx", decision_taken="Dec", reasoning="Reason",
            status=DecisionStatusEnum.UNDER_REVIEW.value, created_by=self.bob_emp.id,
            created_at=now - timedelta(days=2), updated_at=now - timedelta(days=2)
        )
        self.d6 = Decision(
            id=6, title="Bob Rejected Decision", problem_statement="Rej problem",
            context="Ctx", decision_taken="Dec", reasoning="Reason",
            status=DecisionStatusEnum.REJECTED.value, created_by=self.bob_emp.id,
            created_at=now - timedelta(days=1), updated_at=now
        )
        self.db.add_all([self.d1, self.d2, self.d3, self.d4, self.d5, self.d6])
        self.db.commit()

        # Approvals
        self.appr1 = Approval(
            id=1, decision_id=self.d3.id, reviewer_id=self.carol_rev.id,
            action=ApprovalActionEnum.APPROVED.value, previous_status="Submitted",
            new_status="Approved", comment="Great job", created_at=now - timedelta(days=1)
        )
        self.appr2 = Approval(
            id=2, decision_id=self.d6.id, reviewer_id=self.dave_mgr.id,
            action=ApprovalActionEnum.REJECTED.value, previous_status="Under Review",
            new_status="Rejected", rejection_reason="Insufficient data", created_at=now
        )
        self.db.add_all([self.appr1, self.appr2])
        self.db.commit()

        # Audit Logs
        self.audit1 = AuditLog(
            id=1, user_id=self.alice_emp.id, action=AuditActionEnum.DECISION_CREATED.value,
            entity_type="decision", entity_id=self.d1.id, description="Alice created draft",
            created_at=now - timedelta(days=5)
        )
        self.audit2 = AuditLog(
            id=2, user_id=self.bob_emp.id, action=AuditActionEnum.DECISION_CREATED.value,
            entity_type="decision", entity_id=self.d4.id, description="Bob created secret draft",
            created_at=now - timedelta(days=4)
        )
        self.audit3 = AuditLog(
            id=3, user_id=self.carol_rev.id, action=AuditActionEnum.DECISION_APPROVED.value,
            entity_type="decision", entity_id=self.d3.id, description="Carol approved decision",
            created_at=now - timedelta(days=1)
        )
        self.db.add_all([self.audit1, self.audit2, self.audit3])
        self.db.commit()

        # Discussions
        self.disc1 = Discussion(
            id=1, decision_id=self.d3.id, user_id=self.alice_emp.id,
            content="Can we clarify rollout timeline?", created_at=now - timedelta(days=2)
        )
        self.disc2 = Discussion(
            id=2, decision_id=self.d4.id, user_id=self.bob_emp.id,
            content="Bob private draft note", created_at=now - timedelta(days=4)
        )
        self.db.add_all([self.disc1, self.disc2])
        self.db.commit()

        # Documents
        self.doc1 = Document(
            id=1, decision_id=self.d3.id, original_filename="architecture_v1.pdf",
            stored_filename="stored_arch_v1.pdf", file_path="uploads/secret_path.pdf",
            file_size=10240, content_type="application/pdf",
            uploaded_by=self.alice_emp.id, created_at=now - timedelta(days=2)
        )
        self.doc2 = Document(
            id=2, decision_id=self.d4.id, original_filename="bob_internal_notes.docx",
            stored_filename="stored_bob_notes.docx", file_path="uploads/bob_secret.docx",
            file_size=20480, content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            uploaded_by=self.bob_emp.id, created_at=now - timedelta(days=4)
        )
        self.db.add_all([self.doc1, self.doc2])
        self.db.commit()

        # Notifications
        self.notif1 = Notification(
            id=1, recipient_id=self.alice_emp.id, title="Decision Approved",
            message="Your decision was approved", notification_type="DECISION_APPROVED",
            is_read=False, created_at=now - timedelta(hours=2)
        )
        self.notif2 = Notification(
            id=2, recipient_id=self.bob_emp.id, title="Review Needed",
            message="You have a task", notification_type="DECISION_SUBMITTED",
            is_read=False, created_at=now - timedelta(hours=1)
        )
        self.db.add_all([self.notif1, self.notif2])
        self.db.commit()

    # 1. Authenticated user can access dashboard
    def test_authenticated_user_access(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        self.assertIsNotNone(res)
        self.assertIn("kpis", res)
        self.assertEqual(res["user_role"], RoleEnum.EMPLOYEE.value)

    # 2. Unauthenticated user gets 401 (API route protection verified via dependency)
    def test_unauthenticated_user_rejection(self):
        from fastapi import HTTPException
        from app.core.dependencies import get_current_user
        # Simulating unauthenticated call without credentials
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(credentials=None, db=self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    # 3. Employee receives correctly scoped dashboard
    def test_employee_scoping(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        # Alice authored 3 decisions: d1 (Draft), d2 (Submitted), d3 (Approved)
        self.assertEqual(res["kpis"]["total_decisions"], 3)
        self.assertEqual(res["kpis"]["draft"], 1)
        self.assertEqual(res["kpis"]["pending_review"], 1)
        self.assertEqual(res["kpis"]["approved"], 1)
        self.assertEqual(res["kpis"]["my_decisions"], 3)

        # Bob's private draft (d4) must NOT appear anywhere for Alice
        dec_ids = [d["id"] for d in res["recent_decisions"]]
        self.assertNotIn(4, dec_ids)

    # 4. Reviewer receives correctly scoped dashboard
    def test_reviewer_scoping(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.carol_rev)
        # Reviewer sees non-draft decisions (d2, d3, d5, d6) = 4 decisions
        self.assertEqual(res["kpis"]["total_decisions"], 4)
        self.assertEqual(res["kpis"]["approved"], 1)
        self.assertEqual(res["kpis"]["rejected"], 1)
        self.assertEqual(res["kpis"]["pending_review"], 2)  # d2 (Submitted), d5 (Under Review)
        # Neither Alice's nor Bob's draft decisions are visible
        dec_ids = [d["id"] for d in res["recent_decisions"]]
        self.assertNotIn(1, dec_ids)
        self.assertNotIn(4, dec_ids)

    # 5. Manager receives correctly scoped dashboard
    def test_manager_scoping(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.dave_mgr)
        # Manager sees non-draft decisions (d2, d3, d5, d6) = 4 decisions
        self.assertEqual(res["kpis"]["total_decisions"], 4)
        self.assertEqual(res["kpis"]["pending_review"], 2)
        # Manager has broader audit log access
        self.assertGreaterEqual(len(res["recent_activity"]), 3)

    # 6. Administrator receives organization-wide dashboard
    def test_administrator_scoping(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        # Admin sees all 6 decisions (including both drafts d1 and d4)
        self.assertEqual(res["kpis"]["total_decisions"], 6)
        self.assertEqual(res["kpis"]["draft"], 2)
        self.assertEqual(res["kpis"]["pending_review"], 2)
        self.assertEqual(res["kpis"]["approved"], 1)
        self.assertEqual(res["kpis"]["rejected"], 1)

    # 7. Total decision count is correct
    def test_total_decision_count(self):
        self._seed_sample_data()
        admin_res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        self.assertEqual(admin_res["kpis"]["total_decisions"], 6)

    # 8. Status distribution is correct
    def test_status_distribution(self):
        self._seed_sample_data()
        admin_res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        dist = {item["status"]: item["count"] for item in admin_res["status_distribution"]}
        self.assertEqual(dist.get("Draft"), 2)
        self.assertEqual(dist.get("Submitted"), 1)
        self.assertEqual(dist.get("Under Review"), 1)
        self.assertEqual(dist.get("Approved"), 1)
        self.assertEqual(dist.get("Rejected"), 1)

    # 9. Approval count is correct
    def test_approval_count(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        self.assertEqual(res["approval_summary"]["approved_count"], 1)

    # 10. Rejection count is correct
    def test_rejection_count(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        self.assertEqual(res["approval_summary"]["rejected_count"], 1)

    # 11. Pending count is correct
    def test_pending_count(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        self.assertEqual(res["kpis"]["pending_review"], 2)

    # 12. Decision trend is correct
    def test_decision_trend(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        trend = res["decision_trend"]
        self.assertIsInstance(trend, list)
        self.assertGreater(len(trend), 0)
        total_in_trend = sum(t["count"] for t in trend)
        self.assertEqual(total_in_trend, 6)

    # 13. Recent decisions are correctly ordered
    def test_recent_decisions_ordering(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        recent = res["recent_decisions"]
        self.assertGreater(len(recent), 1)
        # Verify descending order by updated_at
        for i in range(len(recent) - 1):
            self.assertGreaterEqual(recent[i]["updated_at"], recent[i + 1]["updated_at"])

    # 14. Pending review items are correctly scoped
    def test_pending_review_items_scoped(self):
        self._seed_sample_data()
        # Alice (Employee): only her own submitted decisions awaiting review
        alice_res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        alice_pending = alice_res["pending_items"]
        self.assertEqual(len(alice_pending), 1)
        self.assertEqual(alice_pending[0]["id"], self.d2.id)

        # Carol (Reviewer): all pending decisions in system (d2 and d5)
        carol_res = dashboard_service.get_dashboard_summary(self.db, self.carol_rev)
        carol_pending_ids = [p["id"] for p in carol_res["pending_items"]]
        self.assertIn(self.d2.id, carol_pending_ids)
        self.assertIn(self.d5.id, carol_pending_ids)

    # 15. Recent activity respects permissions
    def test_recent_activity_permissions(self):
        self._seed_sample_data()
        # Alice should NOT see Bob's secret draft activity (audit2)
        alice_res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        alice_act_ids = [a["id"] for a in alice_res["recent_activity"]]
        self.assertNotIn(self.audit2.id, alice_act_ids)

        # Admin sees all activity
        admin_res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        admin_act_ids = [a["id"] for a in admin_res["recent_activity"]]
        self.assertIn(self.audit2.id, admin_act_ids)

    # 16. Recent discussions respect decision visibility
    def test_recent_discussions_visibility(self):
        self._seed_sample_data()
        # Alice should NOT see discussion on Bob's secret draft (disc2)
        alice_res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        disc_ids = [d["id"] for d in alice_res["recent_discussions"]]
        self.assertNotIn(self.disc2.id, disc_ids)
        self.assertIn(self.disc1.id, disc_ids)

    # 17. Recent documents respect access rules and do NOT expose server storage paths
    def test_recent_documents_access_rules(self):
        self._seed_sample_data()
        alice_res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        doc_ids = [d["id"] for d in alice_res["recent_documents"]]
        self.assertNotIn(self.doc2.id, doc_ids)
        self.assertIn(self.doc1.id, doc_ids)

        # Verify no physical storage paths are exposed in response
        for doc in alice_res["recent_documents"]:
            self.assertNotIn("storage_path", doc)
            self.assertNotIn("secret_path", doc.get("filename", ""))

    # 18. Notification summary belongs to current user
    def test_notification_summary_scoped(self):
        self._seed_sample_data()
        alice_res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        notif_ids = [n["id"] for n in alice_res["notifications"]]
        self.assertIn(self.notif1.id, notif_ids)
        self.assertNotIn(self.notif2.id, notif_ids)
        self.assertEqual(alice_res["kpis"]["unread_notifications_count"], 1)

    # 19. Dashboard does not expose inaccessible decisions
    def test_inaccessible_decisions_hidden(self):
        self._seed_sample_data()
        alice_res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        all_d_ids = [d["id"] for d in alice_res["recent_decisions"]]
        self.assertNotIn(self.d4.id, all_d_ids)

    # 20. Empty database returns valid empty dashboard
    def test_empty_database_returns_valid_dashboard(self):
        res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        self.assertEqual(res["kpis"]["total_decisions"], 0)
        self.assertEqual(res["kpis"]["pending_review"], 0)
        self.assertEqual(res["kpis"]["approved"], 0)
        self.assertEqual(res["kpis"]["rejected"], 0)
        self.assertEqual(res["kpis"]["my_decisions"], 0)
        self.assertEqual(res["recent_decisions"], [])
        self.assertEqual(res["pending_items"], [])
        self.assertEqual(res["recent_activity"], [])
        self.assertEqual(res["recent_discussions"], [])
        self.assertEqual(res["recent_documents"], [])
        self.assertEqual(res["notifications"], [])

    # 21. Dashboard API does not return null/broken KPI values
    def test_no_null_broken_kpi_values(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.alice_emp)
        kpis = res["kpis"]
        for key, val in kpis.items():
            self.assertIsNotNone(val, f"KPI {key} should not be None")
            self.assertIsInstance(val, (int, float), f"KPI {key} should be numeric")
            self.assertGreaterEqual(val, 0, f"KPI {key} should not be negative")

    # 22. Dashboard data is consistent with Reports
    def test_dashboard_consistency_with_reports(self):
        self._seed_sample_data()
        for test_user in [self.alice_emp, self.carol_rev, self.dave_mgr, self.eve_admin]:
            dash_res = dashboard_service.get_dashboard_summary(self.db, test_user)
            rep_summary = report_service.get_decision_summary_report(self.db, test_user)
            rep_approval = report_service.get_approval_report(self.db, test_user)

            # Strict equality assertion between Dashboard and Reports
            self.assertEqual(dash_res["kpis"]["total_decisions"], rep_summary["total_decisions"])
            self.assertEqual(dash_res["kpis"]["approved"], rep_summary["approved"])
            self.assertEqual(dash_res["kpis"]["rejected"], rep_summary["rejected"])
            self.assertEqual(dash_res["kpis"]["draft"], rep_summary["draft"])
            self.assertEqual(
                dash_res["kpis"]["pending_review"],
                rep_summary["submitted"] + rep_summary["under_review"]
            )
            self.assertEqual(
                dash_res["approval_summary"]["approval_rate"],
                rep_approval["approval_rate"]
            )
            self.assertEqual(
                dash_res["approval_summary"]["rejection_rate"],
                rep_approval["rejection_rate"]
            )

    # 23. Unauthorized dashboard data access is prevented
    def test_unauthorized_dashboard_data_access_prevented(self):
        self._seed_sample_data()
        # Even if Bob tries to access via API as Bob, he cannot see Alice's Draft (d1)
        bob_res = dashboard_service.get_dashboard_summary(self.db, self.bob_emp)
        bob_dec_ids = [d["id"] for d in bob_res["recent_decisions"]]
        self.assertNotIn(self.d1.id, bob_dec_ids)

    # 24. Pagination/limits on recent items work correctly
    def test_pagination_limits_on_recent_items(self):
        now = datetime.now(timezone.utc)
        # Create 15 decisions
        for i in range(15):
            d = Decision(
                id=100 + i, title=f"Bulk Decision {i}", problem_statement="Problem",
                context="Ctx", decision_taken="Dec", reasoning="Reason",
                status=DecisionStatusEnum.APPROVED.value, created_by=self.eve_admin.id,
                created_at=now - timedelta(hours=i), updated_at=now - timedelta(hours=i)
            )
            self.db.add(d)
        self.db.commit()

        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        self.assertLessEqual(len(res["recent_decisions"]), 10)

    # 25. Dashboard endpoint handles date/time values correctly and computes turnaround
    def test_datetime_serialization_handling(self):
        self._seed_sample_data()
        res = dashboard_service.get_dashboard_summary(self.db, self.eve_admin)
        # Turnaround time calculated from valid timestamps
        self.assertIsNotNone(res["approval_summary"]["average_turnaround_hours"])
        self.assertGreater(res["approval_summary"]["average_turnaround_hours"], 0)

        # Verify recent decisions dates are valid datetimes
        for dec in res["recent_decisions"]:
            self.assertIsInstance(dec["created_at"], datetime)
            self.assertIsInstance(dec["updated_at"], datetime)


if __name__ == "__main__":
    unittest.main()
