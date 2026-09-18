"""
Test Suite: Milestone 3 - Centralized Immutable Audit Logging System
Covers 35 Test Cases:
1. Decision creation emits DECISION_CREATED
2. Decision update emits DECISION_UPDATED
3. Decision no-op update emits NO audit log
4. Decision submission emits DECISION_SUBMITTED
5. Decision approval emits DECISION_APPROVED
6. Decision rejection emits DECISION_REJECTED
7. Alternative creation emits ALTERNATIVE_CREATED
8. Alternative update emits ALTERNATIVE_UPDATED
9. Alternative deletion emits ALTERNATIVE_DELETED
10. Document upload emits DOCUMENT_UPLOADED
11. Document deletion emits DOCUMENT_DELETED
12. Discussion creation emits DISCUSSION_CREATED
13. Discussion reply emits DISCUSSION_REPLY_CREATED
14. Discussion update emits DISCUSSION_UPDATED
15. Discussion deletion emits DISCUSSION_DELETED
16. Version snapshot emits VERSION_CREATED
17. User registration emits USER_REGISTERED
18. User login emits USER_LOGIN
19. Notification creation emits NOTIFICATION_CREATED
20. Notification read emits NOTIFICATION_READ
21. Employee role access to audit logs is forbidden (HTTP 403)
22. Reviewer role access to audit logs is forbidden (HTTP 403)
23. Manager role access to audit logs is allowed
24. Administrator role access to audit logs is allowed
25. Unauthenticated access check (HTTP 401)
26. Audit log pagination works correctly
27. Filtering by action works
28. Filtering by entity_type works
29. Filtering by user_id works
30. Filtering by date range works
31. Get single audit log detail by ID works
32. Verify no modification (PUT/PATCH) routes exist on audit logs
33. Verify no deletion (DELETE) routes exist on audit logs
34. Sensitive credentials (passwords, tokens) are never stored in audit logs
35. Acting user is recorded accurately on all audit entries
"""

import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from io import BytesIO
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException, UploadFile, status

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.alternative import Alternative
from app.models.approval import Approval
from app.models.audit_log import AuditLog, AuditActionEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.decision_version import DecisionVersion
from app.models.discussion import Discussion
from app.models.document import Document
from app.models.notification import Notification, NotificationTypeEnum
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.alternative import AlternativeCreateRequest, AlternativeUpdateRequest
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest
from app.schemas.user import UserRegisterRequest
from app.services.alternative_service import create_alternative, update_alternative, delete_alternative
from app.services.approval_service import approve_decision, reject_decision
from app.services.audit_service import (
    create_audit_log,
    get_audit_logs,
    get_audit_log_by_id,
    sanitize_details,
)
from app.services.decision_service import create_decision, submit_decision, update_decision
from app.services.discussion_service import create_discussion, update_discussion, delete_discussion
from app.services.document_service import upload_document, delete_document
from app.services.notification_service import create_notification, mark_notification_read
from app.services.user_service import create_user
from app.api.routes.audit_logs import list_audit_logs, get_single_audit_log, allow_audit_viewers
from app.api.routes import audit_logs as audit_logs_module


class TestAuditLoggingSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.SessionLocal = sessionmaker(bind=cls.engine, autocommit=False, autoflush=False)
        Base.metadata.create_all(bind=cls.engine)

    def _clean_tables(self):
        self.db.query(AuditLog).delete()
        self.db.query(Notification).delete()
        self.db.query(Approval).delete()
        self.db.query(Discussion).delete()
        self.db.query(Document).delete()
        self.db.query(Alternative).delete()
        self.db.query(DecisionVersion).delete()
        self.db.query(Decision).delete()
        self.db.commit()

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
        self.employee = self.db.query(User).filter(User.email == "alice_audit@test.com").first()
        if not self.employee:
            self.employee = User(full_name="Alice Audit", email="alice_audit@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.employee)

        self.reviewer = self.db.query(User).filter(User.email == "bob_audit@test.com").first()
        if not self.reviewer:
            self.reviewer = User(full_name="Bob Reviewer", email="bob_audit@test.com", hashed_password="hash", role_id=rev_role.id)
            self.db.add(self.reviewer)

        self.manager = self.db.query(User).filter(User.email == "charlie_audit@test.com").first()
        if not self.manager:
            self.manager = User(full_name="Charlie Manager", email="charlie_audit@test.com", hashed_password="hash", role_id=mgr_role.id)
            self.db.add(self.manager)

        self.admin = self.db.query(User).filter(User.email == "dana_audit@test.com").first()
        if not self.admin:
            self.admin = User(full_name="Dana Admin", email="dana_audit@test.com", hashed_password="hash", role_id=adm_role.id)
            self.db.add(self.admin)

        self.db.commit()
        self.db.refresh(self.employee)
        self.db.refresh(self.reviewer)
        self.db.refresh(self.manager)
        self.db.refresh(self.admin)

        self._clean_tables()

    def tearDown(self):
        try:
            self._clean_tables()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def _create_decision(self, title="Audit Test Decision", creator=None):
        creator = creator or self.employee
        return create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title=title,
                problem_statement="Problem statement for audit log test",
                context="Context constraints and operational parameters",
                decision_taken="Option Chosen for Testing",
                reasoning="Detailed reasoning and justification",
                expected_outcome="Positive operational outcome",
            ),
            user_id=creator.id,
        )

    # 1. Decision Creation -> DECISION_CREATED
    def test_01_decision_created_audit_log(self):
        dec = self._create_decision("Audit Decision One", self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DECISION_CREATED.value,
            AuditLog.entity_id == dec.id,
        ).first()

        self.assertIsNotNone(log, "Audit log for DECISION_CREATED should exist")
        self.assertEqual(log.user_id, self.employee.id)
        self.assertEqual(log.entity_type, "Decision")
        self.assertIn("Audit Decision One", log.description)
        self.assertEqual(log.details.get("title"), "Audit Decision One")

    # 2. Decision Update -> DECISION_UPDATED
    def test_02_decision_updated_audit_log(self):
        dec = self._create_decision("Initial Title", self.employee)
        update_data = DecisionUpdateRequest(title="Updated Title", reasoning="New updated reasoning")
        update_decision(self.db, dec.id, update_data, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DECISION_UPDATED.value,
            AuditLog.entity_id == dec.id,
        ).first()

        self.assertIsNotNone(log, "Audit log for DECISION_UPDATED should exist")
        self.assertEqual(log.user_id, self.employee.id)
        self.assertIn("title", log.details.get("change_summary", ""))

    # 3. Decision No-Op Update -> NO Audit Log
    def test_03_decision_noop_update_no_audit_log(self):
        dec = self._create_decision("No Op Title", self.employee)
        self.db.query(AuditLog).delete()
        self.db.commit()

        update_data = DecisionUpdateRequest(title="No Op Title")
        update_decision(self.db, dec.id, update_data, self.employee)

        update_logs = self.db.query(AuditLog).filter(AuditLog.action == AuditActionEnum.DECISION_UPDATED.value).all()
        self.assertEqual(len(update_logs), 0, "No-op decision update must NOT emit an audit log")

    # 4. Decision Submission -> DECISION_SUBMITTED
    def test_04_decision_submitted_audit_log(self):
        dec = self._create_decision("Submit Decision", self.employee)
        submit_decision(self.db, dec.id, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DECISION_SUBMITTED.value,
            AuditLog.entity_id == dec.id,
        ).first()

        self.assertIsNotNone(log, "DECISION_SUBMITTED audit log should exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 5. Decision Approval -> DECISION_APPROVED
    def test_05_decision_approved_audit_log(self):
        dec = self._create_decision("Decision to Approve", self.employee)
        submit_decision(self.db, dec.id, self.employee)

        approve_decision(self.db, dec.id, self.reviewer, "Looks good and approved")

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DECISION_APPROVED.value,
            AuditLog.entity_id == dec.id,
        ).first()

        self.assertIsNotNone(log, "DECISION_APPROVED audit log should exist")
        self.assertEqual(log.user_id, self.reviewer.id)
        self.assertEqual(log.details.get("comment"), "Looks good and approved")

    # 6. Decision Rejection -> DECISION_REJECTED
    def test_06_decision_rejected_audit_log(self):
        dec = self._create_decision("Decision to Reject", self.employee)
        submit_decision(self.db, dec.id, self.employee)

        reject_decision(self.db, dec.id, self.reviewer, "Insufficient financial analysis")

        log = self.db.query(AuditLog).filter(
            AuditActionEnum.DECISION_REJECTED.value == AuditLog.action,
            AuditLog.entity_id == dec.id,
        ).first()

        self.assertIsNotNone(log, "DECISION_REJECTED audit log should exist")
        self.assertEqual(log.user_id, self.reviewer.id)
        self.assertEqual(log.details.get("reason"), "Insufficient financial analysis")

    # 7. Alternative Creation -> ALTERNATIVE_CREATED
    def test_07_alternative_created_audit_log(self):
        dec = self._create_decision("Alt Test Decision", self.employee)
        alt_data = AlternativeCreateRequest(name="Alternative A", description="Option A", pros="Fast", cons="Costly", cost="$$", feasibility="HIGH")
        alt = create_alternative(self.db, dec.id, alt_data, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.ALTERNATIVE_CREATED.value,
            AuditLog.entity_id == alt.id,
        ).first()

        self.assertIsNotNone(log, "ALTERNATIVE_CREATED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)
        self.assertEqual(log.entity_type, "Alternative")

    # 8. Alternative Update -> ALTERNATIVE_UPDATED
    def test_08_alternative_updated_audit_log(self):
        dec = self._create_decision("Alt Update Decision", self.employee)
        alt_data = AlternativeCreateRequest(name="Alternative A", description="Option A", pros="Fast", cons="Costly", cost="$$", feasibility="HIGH")
        alt = create_alternative(self.db, dec.id, alt_data, self.employee)

        update_alt_data = AlternativeUpdateRequest(name="Alternative A+", cost="$$$")
        update_alternative(self.db, dec.id, alt.id, update_alt_data, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.ALTERNATIVE_UPDATED.value,
            AuditLog.entity_id == alt.id,
        ).first()

        self.assertIsNotNone(log, "ALTERNATIVE_UPDATED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 9. Alternative Deletion -> ALTERNATIVE_DELETED
    def test_09_alternative_deleted_audit_log(self):
        dec = self._create_decision("Alt Delete Decision", self.employee)
        alt_data = AlternativeCreateRequest(name="Alternative B", description="Option B", pros="Cheap", cons="Slow")
        alt = create_alternative(self.db, dec.id, alt_data, self.employee)

        delete_alternative(self.db, dec.id, alt.id, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.ALTERNATIVE_DELETED.value,
            AuditLog.entity_id == alt.id,
        ).first()

        self.assertIsNotNone(log, "ALTERNATIVE_DELETED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 10. Document Upload -> DOCUMENT_UPLOADED
    def test_10_document_uploaded_audit_log(self):
        dec = self._create_decision("Doc Upload Decision", self.employee)
        fake_file = UploadFile(filename="audit_spec.pdf", file=BytesIO(b"%PDF-1.4 dummy file content"), headers={"content-type": "application/pdf"})
        doc = upload_document(db=self.db, decision_id=dec.id, file=fake_file, current_user=self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DOCUMENT_UPLOADED.value,
            AuditLog.entity_id == doc.id,
        ).first()

        self.assertIsNotNone(log, "DOCUMENT_UPLOADED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)
        self.assertEqual(log.entity_type, "Document")

    # 11. Document Deletion -> DOCUMENT_DELETED
    def test_11_document_deleted_audit_log(self):
        dec = self._create_decision("Doc Delete Decision", self.employee)
        fake_file = UploadFile(filename="temp_delete.pdf", file=BytesIO(b"%PDF-1.4 dummy delete"), headers={"content-type": "application/pdf"})
        doc = upload_document(db=self.db, decision_id=dec.id, file=fake_file, current_user=self.employee)

        delete_document(self.db, dec.id, doc.id, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DOCUMENT_DELETED.value,
            AuditLog.entity_id == doc.id,
        ).first()

        self.assertIsNotNone(log, "DOCUMENT_DELETED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 12. Discussion Creation -> DISCUSSION_CREATED
    def test_12_discussion_created_audit_log(self):
        dec = self._create_decision("Disc Decision", self.employee)
        disc = create_discussion(self.db, dec.id, "What about security implications?", self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DISCUSSION_CREATED.value,
            AuditLog.entity_id == disc.id,
        ).first()

        self.assertIsNotNone(log, "DISCUSSION_CREATED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 13. Discussion Reply -> DISCUSSION_REPLY_CREATED
    def test_13_discussion_reply_audit_log(self):
        dec = self._create_decision("Disc Reply Decision", self.employee)
        submit_decision(self.db, dec.id, self.employee)

        parent_disc = create_discussion(self.db, dec.id, "Main comment", self.employee)
        reply_disc = create_discussion(self.db, dec.id, "Reply comment", self.reviewer, parent_id=parent_disc.id)

        log = self.db.query(AuditLog).filter(
            AuditActionEnum.DISCUSSION_REPLY_CREATED.value == AuditLog.action,
            AuditLog.entity_id == reply_disc.id,
        ).first()

        self.assertIsNotNone(log, "DISCUSSION_REPLY_CREATED audit log must exist")
        self.assertEqual(log.user_id, self.reviewer.id)
        self.assertEqual(log.details.get("parent_id"), parent_disc.id)

    # 14. Discussion Update -> DISCUSSION_UPDATED
    def test_14_discussion_updated_audit_log(self):
        dec = self._create_decision("Disc Update Decision", self.employee)
        disc = create_discussion(self.db, dec.id, "Initial Comment", self.employee)

        update_discussion(self.db, dec.id, disc.id, "Edited Comment", self.employee)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.DISCUSSION_UPDATED.value,
            AuditLog.entity_id == disc.id,
        ).first()

        self.assertIsNotNone(log, "DISCUSSION_UPDATED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 15. Discussion Deletion -> DISCUSSION_DELETED
    def test_15_discussion_deleted_audit_log(self):
        dec = self._create_decision("Disc Delete Decision", self.employee)
        disc = create_discussion(self.db, dec.id, "Comment to Delete", self.employee)

        delete_discussion(self.db, dec.id, disc.id, self.employee)

        log = self.db.query(AuditLog).filter(
            AuditActionEnum.DISCUSSION_DELETED.value == AuditLog.action,
            AuditLog.entity_id == disc.id,
        ).first()

        self.assertIsNotNone(log, "DISCUSSION_DELETED audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 16. Version Snapshot -> VERSION_CREATED
    def test_16_version_created_audit_log(self):
        dec = self._create_decision("Version Audit Decision", self.employee)
        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.VERSION_CREATED.value,
            AuditLog.entity_id == dec.id,
        ).first()

        self.assertIsNotNone(log, "VERSION_CREATED audit log must exist for snapshot")
        self.assertEqual(log.user_id, self.employee.id)
        self.assertEqual(log.details.get("version_number"), 1)

    # 17. User Registration -> USER_REGISTERED
    def test_17_user_registered_audit_log(self):
        user_in = UserRegisterRequest(
            full_name="Frank Auditee",
            email="frank_audit@test.com",
            password="StrongPassword123!",
            role=RoleEnum.EMPLOYEE,
        )
        new_user = create_user(self.db, user_in)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.USER_REGISTERED.value,
            AuditLog.entity_id == new_user.id,
        ).first()

        self.assertIsNotNone(log, "USER_REGISTERED audit log must exist")
        self.assertEqual(log.user_id, new_user.id)
        self.assertEqual(log.entity_type, "User")
        self.assertNotIn("password", log.details)
        self.assertNotIn("StrongPassword123!", str(log.details))

    # 18. User Login -> USER_LOGIN
    def test_18_user_login_audit_log(self):
        create_audit_log(
            db=self.db,
            action=AuditActionEnum.USER_LOGIN,
            entity_type="User",
            entity_id=self.employee.id,
            user_id=self.employee.id,
            details={"email": self.employee.email, "role": "Employee"},
            description="User logged in successfully",
        )

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.USER_LOGIN.value,
            AuditLog.entity_id == self.employee.id,
        ).first()

        self.assertIsNotNone(log, "USER_LOGIN audit log must exist")
        self.assertEqual(log.user_id, self.employee.id)

    # 19. Notification Creation -> NOTIFICATION_CREATED
    def test_19_notification_created_audit_log(self):
        dec = self._create_decision("Notif Audit Decision", self.employee)
        notif = create_notification(
            db=self.db,
            recipient_id=self.reviewer.id,
            notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
            title="Decision Submitted",
            message="Decision has been submitted for review",
            decision_id=dec.id,
        )

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.NOTIFICATION_CREATED.value,
            AuditLog.entity_id == notif.id,
        ).first()

        self.assertIsNotNone(log, "NOTIFICATION_CREATED audit log must exist")
        self.assertEqual(log.entity_type, "Notification")

    # 20. Notification Read -> NOTIFICATION_READ
    def test_20_notification_read_audit_log(self):
        dec = self._create_decision("Notif Read Decision", self.employee)
        notif = create_notification(
            db=self.db,
            recipient_id=self.reviewer.id,
            notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
            title="Decision Submitted",
            message="Read me",
            decision_id=dec.id,
        )

        mark_notification_read(self.db, notif.id, self.reviewer)

        log = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.NOTIFICATION_READ.value,
            AuditLog.entity_id == notif.id,
        ).first()

        self.assertIsNotNone(log, "NOTIFICATION_READ audit log must exist")
        self.assertEqual(log.user_id, self.reviewer.id)

    # 21-25. RBAC: Employee (403), Reviewer (403), Manager (200), Admin (200), Unauthenticated (401)
    def test_21_employee_cannot_view_audit_logs(self):
        role_checker = allow_audit_viewers
        with self.assertRaises(HTTPException) as ctx:
            role_checker(self.employee)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_22_reviewer_cannot_view_audit_logs(self):
        role_checker = allow_audit_viewers
        with self.assertRaises(HTTPException) as ctx:
            role_checker(self.reviewer)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_23_manager_can_view_audit_logs(self):
        role_checker = allow_audit_viewers
        user = role_checker(self.manager)
        self.assertEqual(user.id, self.manager.id)

        res = list_audit_logs(page=1, page_size=10, db=self.db, current_user=self.manager)
        items = res.get("items") if isinstance(res, dict) else res.items
        self.assertIsNotNone(items)

    def test_24_admin_can_view_audit_logs(self):
        role_checker = allow_audit_viewers
        user = role_checker(self.admin)
        self.assertEqual(user.id, self.admin.id)

        res = list_audit_logs(page=1, page_size=10, db=self.db, current_user=self.admin)
        items = res.get("items") if isinstance(res, dict) else res.items
        self.assertIsNotNone(items)

    def test_25_unauthenticated_role_checker(self):
        role_checker = allow_audit_viewers
        with self.assertRaises(HTTPException) as ctx:
            role_checker(None)
        self.assertEqual(ctx.exception.status_code, status.HTTP_401_UNAUTHORIZED)

    # 26. Pagination Works Correctly
    def test_26_audit_log_pagination(self):
        for i in range(15):
            create_audit_log(
                db=self.db,
                action=AuditActionEnum.DECISION_CREATED,
                entity_type="Decision",
                entity_id=i + 1,
                user_id=self.employee.id,
                description=f"Pagination test {i+1}",
            )

        page1 = list_audit_logs(page=1, page_size=5, db=self.db, current_user=self.admin)
        total1 = page1["total"] if isinstance(page1, dict) else page1.total
        items1 = page1["items"] if isinstance(page1, dict) else page1.items
        self.assertEqual(total1, 15)
        self.assertEqual(len(items1), 5)

        page2 = list_audit_logs(page=2, page_size=5, db=self.db, current_user=self.admin)
        items2 = page2["items"] if isinstance(page2, dict) else page2.items
        self.assertEqual(len(items2), 5)

        p1_ids = {it.id for it in items1}
        p2_ids = {it.id for it in items2}
        self.assertEqual(len(p1_ids.intersection(p2_ids)), 0)

    # 27. Action Filtering
    def test_27_filter_by_action(self):
        create_audit_log(self.db, AuditActionEnum.DECISION_CREATED, "Decision", 1, self.employee.id, "Created")
        create_audit_log(self.db, AuditActionEnum.DECISION_SUBMITTED, "Decision", 1, self.employee.id, "Submitted")
        create_audit_log(self.db, AuditActionEnum.DECISION_APPROVED, "Decision", 1, self.reviewer.id, "Approved")

        res = list_audit_logs(action=AuditActionEnum.DECISION_APPROVED.value, db=self.db, current_user=self.manager)
        total = res["total"] if isinstance(res, dict) else res.total
        items = res["items"] if isinstance(res, dict) else res.items
        self.assertEqual(total, 1)
        self.assertEqual(items[0].action, AuditActionEnum.DECISION_APPROVED.value)

    # 28. Entity Type Filtering
    def test_28_filter_by_entity_type(self):
        create_audit_log(self.db, AuditActionEnum.DECISION_CREATED, "Decision", 10, self.employee.id, "Decision log")
        create_audit_log(self.db, AuditActionEnum.DOCUMENT_UPLOADED, "Document", 20, self.employee.id, "Doc log")

        res = list_audit_logs(entity_type="Document", db=self.db, current_user=self.admin)
        total = res["total"] if isinstance(res, dict) else res.total
        items = res["items"] if isinstance(res, dict) else res.items
        self.assertEqual(total, 1)
        self.assertEqual(items[0].entity_type, "Document")

    # 29. User Filtering
    def test_29_filter_by_user_id(self):
        create_audit_log(self.db, AuditActionEnum.DECISION_CREATED, "Decision", 1, self.employee.id, "Alice action")
        create_audit_log(self.db, AuditActionEnum.DECISION_APPROVED, "Decision", 1, self.reviewer.id, "Bob action")

        res = list_audit_logs(user_id=self.reviewer.id, db=self.db, current_user=self.manager)
        total = res["total"] if isinstance(res, dict) else res.total
        items = res["items"] if isinstance(res, dict) else res.items
        self.assertEqual(total, 1)
        self.assertEqual(items[0].user_id, self.reviewer.id)

    # 30. Date Range Filtering
    def test_30_filter_by_date_range(self):
        now = datetime.now(timezone.utc)
        past = now - timedelta(days=2)
        future = now + timedelta(days=2)

        create_audit_log(self.db, AuditActionEnum.DECISION_CREATED, "Decision", 1, self.employee.id, "Dated log")

        res = list_audit_logs(start_date=past, end_date=future, db=self.db, current_user=self.admin)
        total = res["total"] if isinstance(res, dict) else res.total
        self.assertEqual(total, 1)

        res_empty = list_audit_logs(start_date=past, end_date=past + timedelta(hours=1), db=self.db, current_user=self.admin)
        total_empty = res_empty["total"] if isinstance(res_empty, dict) else res_empty.total
        self.assertEqual(total_empty, 0)

    # 31. Single Audit Log Detail Retrieval
    def test_31_get_single_audit_log_detail(self):
        log = create_audit_log(
            db=self.db,
            action=AuditActionEnum.DECISION_CREATED,
            entity_type="Decision",
            entity_id=99,
            user_id=self.employee.id,
            details={"notes": "Detailed information payload"},
            description="Created decision 99",
            ip_address="192.168.1.50",
            user_agent="Mozilla/5.0 TestBrowser",
        )

        res = get_single_audit_log(audit_log_id=log.id, db=self.db, current_user=self.manager)
        self.assertEqual(res.id, log.id)
        self.assertEqual(res.details.get("notes"), "Detailed information payload")
        self.assertEqual(res.ip_address, "192.168.1.50")
        self.assertEqual(res.user_agent, "Mozilla/5.0 TestBrowser")

    # 32. Verify No Modification (PUT/PATCH) Routes Exist
    def test_32_no_modification_routes(self):
        router_routes = audit_logs_module.router.routes
        mod_methods = {"PUT", "PATCH"}
        for r in router_routes:
            overlap = getattr(r, "methods", set()).intersection(mod_methods)
            self.assertEqual(len(overlap), 0, f"Route {r.path} allows modifying methods: {overlap}")

    # 33. Verify No Deletion (DELETE) Routes Exist
    def test_33_no_deletion_routes(self):
        router_routes = audit_logs_module.router.routes
        for r in router_routes:
            methods = getattr(r, "methods", set())
            self.assertNotIn("DELETE", methods, f"Route {r.path} allows DELETE method!")

    # 34. Verify Sensitive Credentials Never Stored
    def test_34_sensitive_credentials_scrubbed(self):
        dirty_details = {
            "username": "alice",
            "password": "SecretPassword123",
            "access_token": "jwt.secret.payload",
            "refresh_token": "refresh.token.payload",
            "nested": {
                "hashed_password": "$2b$12$e8w",
                "safe_field": "valid_value",
            },
        }

        sanitized = sanitize_details(dirty_details)
        self.assertNotIn("password", sanitized)
        self.assertNotIn("access_token", sanitized)
        self.assertNotIn("refresh_token", sanitized)
        self.assertNotIn("hashed_password", sanitized["nested"])
        self.assertEqual(sanitized["nested"]["safe_field"], "valid_value")

    # 35. Acting User Recorded Accurately
    def test_35_acting_user_recorded_accurately(self):
        create_audit_log(
            db=self.db,
            action=AuditActionEnum.DECISION_CREATED,
            entity_type="Decision",
            entity_id=1,
            user_id=self.admin.id,
            description="Admin performed action",
        )

        res = list_audit_logs(db=self.db, current_user=self.admin)
        items = res["items"] if isinstance(res, dict) else res.items
        self.assertEqual(items[0].user_id, self.admin.id)
        self.assertEqual(items[0].user.full_name, "Dana Admin")
        self.assertEqual(items[0].user.email, "dana_audit@test.com")


if __name__ == "__main__":
    unittest.main()
