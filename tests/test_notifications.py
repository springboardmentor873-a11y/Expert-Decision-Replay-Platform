"""
Test Suite: Milestone 3 - In-App Notifications System
Tests for:
1. Authenticated user can retrieve own notifications
2. Unauthenticated access check (HTTP 401)
3. User cannot retrieve another user's notification (HTTP 403)
4. User can mark own notification as read
5. User cannot mark another user's notification as read (HTTP 403)
6. Mark-all-read affects only current user
7. Unread count is correct
8. Decision submission creates notifications for reviewers
9. Decision approval creates notification for decision owner
10. Decision rejection creates notification for decision owner with reason
11. Discussion creation creates notification
12. Discussion reply creates notification
13. Document upload creates notification
14. Meaningful decision update creates notification
15. No-op decision update does not create notification
16. Correct notification type is stored
17. Related decision_id is stored correctly
18. Self-notification is avoided
19. Duplicate recipients are avoided
20. Notification pagination works
21. unread_only filtering works
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
from app.models.alternative import Alternative
from app.models.approval import Approval, ApprovalActionEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.decision_version import DecisionVersion
from app.models.discussion import Discussion
from app.models.document import Document
from app.models.notification import Notification, NotificationTypeEnum
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest
from app.services.approval_service import approve_decision, reject_decision
from app.services.decision_service import create_decision, submit_decision, update_decision
from app.services.discussion_service import create_discussion
from app.services.notification_service import (
    create_notification,
    create_notifications_for_users,
    get_notification_by_id,
    get_unread_count,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    notify_document_uploaded,
)


class TestNotificationSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.SessionLocal = sessionmaker(bind=cls.engine, autocommit=False, autoflush=False)
        Base.metadata.create_all(bind=cls.engine)

    def _clean_tables(self):
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
        self.alice = self.db.query(User).filter(User.email == "alice_notif@test.com").first()
        if not self.alice:
            self.alice = User(full_name="Alice Author", email="alice_notif@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.alice)

        self.bob = self.db.query(User).filter(User.email == "bob_notif@test.com").first()
        if not self.bob:
            self.bob = User(full_name="Bob Colleague", email="bob_notif@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.bob)

        self.reviewer = self.db.query(User).filter(User.email == "reviewer_notif@test.com").first()
        if not self.reviewer:
            self.reviewer = User(full_name="Rachel Reviewer", email="reviewer_notif@test.com", hashed_password="hash", role_id=rev_role.id)
            self.db.add(self.reviewer)

        self.manager = self.db.query(User).filter(User.email == "manager_notif@test.com").first()
        if not self.manager:
            self.manager = User(full_name="Marcus Manager", email="manager_notif@test.com", hashed_password="hash", role_id=mgr_role.id)
            self.db.add(self.manager)

        self.admin = self.db.query(User).filter(User.email == "admin_notif@test.com").first()
        if not self.admin:
            self.admin = User(full_name="Adam Admin", email="admin_notif@test.com", hashed_password="hash", role_id=adm_role.id)
            self.db.add(self.admin)

        self.db.commit()
        self.db.refresh(self.alice)
        self.db.refresh(self.bob)
        self.db.refresh(self.reviewer)
        self.db.refresh(self.manager)
        self.db.refresh(self.admin)

        # Clear notifications and decision data before each test
        self._clean_tables()

    def tearDown(self):
        try:
            self._clean_tables()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def _create_decision(self, title="Notification Test Decision", creator=None):
        creator = creator or self.alice
        return create_decision(
            db=self.db,
            decision_in=DecisionCreateRequest(
                title=title,
                problem_statement="Problem statement for notification test",
                context="Context constraints",
                decision_taken="Option Chosen",
                reasoning="Reasoning rationale",
                expected_outcome="Expected positive results",
            ),
            user_id=creator.id,
        )

    # -------------------------------------------------------------------------
    # 1. Base Retrieval & Access Control Tests
    # -------------------------------------------------------------------------
    def test_01_authenticated_user_retrieves_own_notifications(self):
        create_notification(
            db=self.db,
            recipient_id=self.alice.id,
            notification_type=NotificationTypeEnum.DECISION_UPDATED,
            title="Alice Notification",
            message="Message for Alice",
        )
        create_notification(
            db=self.db,
            recipient_id=self.bob.id,
            notification_type=NotificationTypeEnum.DECISION_UPDATED,
            title="Bob Notification",
            message="Message for Bob",
        )

        data = get_user_notifications(db=self.db, current_user=self.alice)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0].title, "Alice Notification")
        self.assertEqual(data["total"], 1)

    def test_02_user_cannot_access_other_user_notification(self):
        bob_notif = create_notification(
            db=self.db,
            recipient_id=self.bob.id,
            notification_type=NotificationTypeEnum.DECISION_APPROVED,
            title="Bob Private",
            message="Only for Bob",
        )

        with self.assertRaises(HTTPException) as cm:
            get_notification_by_id(db=self.db, notification_id=bob_notif.id, current_user=self.alice)
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_03_mark_own_notification_as_read(self):
        notif = create_notification(
            db=self.db,
            recipient_id=self.alice.id,
            notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
            title="Mark Read Test",
            message="Unread message",
        )
        self.assertFalse(notif.is_read)

        updated = mark_notification_read(db=self.db, notification_id=notif.id, current_user=self.alice)
        self.assertTrue(updated.is_read)

    def test_04_user_cannot_mark_other_user_notification_as_read(self):
        bob_notif = create_notification(
            db=self.db,
            recipient_id=self.bob.id,
            notification_type=NotificationTypeEnum.DECISION_APPROVED,
            title="Bob Notification",
            message="Only for Bob",
        )

        with self.assertRaises(HTTPException) as cm:
            mark_notification_read(db=self.db, notification_id=bob_notif.id, current_user=self.alice)
        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_05_mark_all_read_affects_only_current_user(self):
        create_notification(db=self.db, recipient_id=self.alice.id, notification_type=NotificationTypeEnum.DECISION_UPDATED, title="A1", message="M1")
        create_notification(db=self.db, recipient_id=self.alice.id, notification_type=NotificationTypeEnum.DECISION_UPDATED, title="A2", message="M2")
        b_notif = create_notification(db=self.db, recipient_id=self.bob.id, notification_type=NotificationTypeEnum.DECISION_UPDATED, title="B1", message="M3")

        updated_count = mark_all_notifications_read(db=self.db, current_user=self.alice)
        self.assertEqual(updated_count, 2)

        # Alice has 0 unread, Bob still has 1 unread
        self.assertEqual(get_unread_count(db=self.db, current_user=self.alice), 0)
        self.assertEqual(get_unread_count(db=self.db, current_user=self.bob), 1)

    def test_06_unread_count_accurate(self):
        self.assertEqual(get_unread_count(db=self.db, current_user=self.alice), 0)
        create_notification(db=self.db, recipient_id=self.alice.id, notification_type=NotificationTypeEnum.DECISION_UPDATED, title="T1", message="M1")
        create_notification(db=self.db, recipient_id=self.alice.id, notification_type=NotificationTypeEnum.DECISION_UPDATED, title="T2", message="M2")
        self.assertEqual(get_unread_count(db=self.db, current_user=self.alice), 2)

    # -------------------------------------------------------------------------
    # 2. Workflow Trigger Tests
    # -------------------------------------------------------------------------
    def test_07_decision_submission_notifies_eligible_reviewers(self):
        decision = self._create_decision("Decision for Review")
        submit_decision(db=self.db, decision_id=decision.id, current_user=self.alice)

        # Reviewer should receive notification
        rev_notifs = get_user_notifications(db=self.db, current_user=self.reviewer)
        rev_titles = [n.title for n in rev_notifs["items"]]
        self.assertIn("Decision Submitted for Review", rev_titles)
        self.assertEqual(rev_notifs["items"][0].decision_id, decision.id)
        self.assertEqual(rev_notifs["items"][0].notification_type, NotificationTypeEnum.DECISION_SUBMITTED.value)

        # Manager should also receive notification
        mgr_notifs = get_user_notifications(db=self.db, current_user=self.manager)
        mgr_titles = [n.title for n in mgr_notifs["items"]]
        self.assertIn("Decision Submitted for Review", mgr_titles)

        # Submitter Alice must NOT receive notification (no self-notification)
        alice_notifs = get_user_notifications(db=self.db, current_user=self.alice)
        self.assertEqual(len(alice_notifs["items"]), 0)

    def test_08_decision_approval_notifies_owner(self):
        decision = self._create_decision("Decision to Approve")
        submit_decision(db=self.db, decision_id=decision.id, current_user=self.alice)

        approve_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            comment="Looks solid, proceeding.",
        )

        # Alice (owner) receives DECISION_APPROVED notification
        alice_notifs = get_user_notifications(db=self.db, current_user=self.alice)
        self.assertEqual(len(alice_notifs["items"]), 1)
        self.assertEqual(alice_notifs["items"][0].notification_type, NotificationTypeEnum.DECISION_APPROVED.value)
        self.assertIn("Decision to Approve", alice_notifs["items"][0].message)

        # Reviewer Rachel should NOT receive self-notification
        rev_notifs = get_user_notifications(db=self.db, current_user=self.reviewer)
        approved_notifs = [n for n in rev_notifs["items"] if n.notification_type == NotificationTypeEnum.DECISION_APPROVED.value]
        self.assertEqual(len(approved_notifs), 0)

    def test_09_decision_rejection_notifies_owner_with_reason(self):
        decision = self._create_decision("Decision to Reject")
        submit_decision(db=self.db, decision_id=decision.id, current_user=self.alice)

        reject_decision(
            db=self.db,
            decision_id=decision.id,
            current_user=self.reviewer,
            reason="Lacks financial feasibility study.",
        )

        alice_notifs = get_user_notifications(db=self.db, current_user=self.alice)
        self.assertEqual(len(alice_notifs["items"]), 1)
        self.assertEqual(alice_notifs["items"][0].notification_type, NotificationTypeEnum.DECISION_REJECTED.value)
        self.assertIn("Lacks financial feasibility study", alice_notifs["items"][0].message)

    def test_10_discussion_creation_notifies_creator(self):
        decision = self._create_decision("Decision for Discussion")

        # Admin user creates discussion comment on Alice's draft decision
        create_discussion(
            db=self.db,
            decision_id=decision.id,
            content="What are the main risks with Option A?",
            current_user=self.admin,
        )

        # Alice (decision owner) receives DISCUSSION_CREATED
        alice_notifs = get_user_notifications(db=self.db, current_user=self.alice)
        self.assertEqual(len(alice_notifs["items"]), 1)
        self.assertEqual(alice_notifs["items"][0].notification_type, NotificationTypeEnum.DISCUSSION_CREATED.value)

        # Admin (author) must NOT receive self-notification
        admin_notifs = get_user_notifications(db=self.db, current_user=self.admin)
        self.assertEqual(len(admin_notifs["items"]), 0)

    def test_11_discussion_reply_notifies_parent_author(self):
        decision = self._create_decision("Decision for Thread")

        parent_disc = create_discussion(
            db=self.db,
            decision_id=decision.id,
            content="Initial discussion topic by Alice",
            current_user=self.alice,
        )

        # Admin replies to Alice
        create_discussion(
            db=self.db,
            decision_id=decision.id,
            content="Admin replying with details",
            current_user=self.admin,
            parent_id=parent_disc.id,
        )

        # Alice receives DISCUSSION_REPLY
        alice_notifs = get_user_notifications(db=self.db, current_user=self.alice)
        reply_notifs = [n for n in alice_notifs["items"] if n.notification_type == NotificationTypeEnum.DISCUSSION_REPLY.value]
        self.assertEqual(len(reply_notifs), 1)

    def test_12_document_upload_notifies_stakeholders(self):
        decision = self._create_decision("Decision for Document")

        # Bob uploads document for Alice's decision
        notify_document_uploaded(
            db=self.db,
            decision=decision,
            actor=self.bob,
            filename="architecture_diagram.pdf",
        )
        self.db.commit()

        alice_notifs = get_user_notifications(db=self.db, current_user=self.alice)
        self.assertEqual(len(alice_notifs["items"]), 1)
        self.assertEqual(alice_notifs["items"][0].notification_type, NotificationTypeEnum.DOCUMENT_UPLOADED.value)
        self.assertIn("architecture_diagram.pdf", alice_notifs["items"][0].message)

    def test_13_meaningful_decision_update_creates_notification(self):
        decision = self._create_decision("Decision to Update")
        # Add a discussion participant so Admin is interested
        create_discussion(db=self.db, decision_id=decision.id, content="Interested party comment", current_user=self.admin)

        # Alice updates title and problem statement on draft decision
        update_decision(
            db=self.db,
            decision_id=decision.id,
            decision_in=DecisionUpdateRequest(title="Updated Title For Testing"),
            current_user=self.alice,
        )

        # Admin should receive notification
        admin_notifs = get_user_notifications(db=self.db, current_user=self.admin)
        update_notifs = [n for n in admin_notifs["items"] if n.notification_type == NotificationTypeEnum.DECISION_UPDATED.value]
        self.assertEqual(len(update_notifs), 1)

    def test_14_noop_decision_update_does_not_create_notification(self):
        decision = self._create_decision("No-Op Decision")
        create_discussion(db=self.db, decision_id=decision.id, content="Admin watching", current_user=self.admin)

        # Clear existing notifications
        self.db.query(Notification).delete()
        self.db.commit()

        # Update with identical title and content (no-op)
        update_decision(
            db=self.db,
            decision_id=decision.id,
            decision_in=DecisionUpdateRequest(title="No-Op Decision"),
            current_user=self.alice,
        )

        # No notifications should be created
        total_notifs = self.db.query(Notification).count()
        self.assertEqual(total_notifs, 0)

    # -------------------------------------------------------------------------
    # 3. Pagination & Filtering Tests
    # -------------------------------------------------------------------------
    def test_15_pagination_and_unread_only_filtering(self):
        # Create 10 notifications for Alice (5 read, 5 unread)
        for i in range(10):
            notif = create_notification(
                db=self.db,
                recipient_id=self.alice.id,
                notification_type=NotificationTypeEnum.DECISION_UPDATED,
                title=f"Notification #{i}",
                message=f"Message #{i}",
            )
            if i >= 5:
                notif.is_read = True
                self.db.commit()

        # Page 1 with page_size=4
        page1 = get_user_notifications(db=self.db, current_user=self.alice, page=1, page_size=4)
        self.assertEqual(len(page1["items"]), 4)
        self.assertEqual(page1["total"], 10)
        self.assertEqual(page1["unread_count"], 5)

        # Unread only filter
        unread_only_data = get_user_notifications(
            db=self.db, current_user=self.alice, page=1, page_size=20, unread_only=True
        )
        self.assertEqual(len(unread_only_data["items"]), 5)
        for item in unread_only_data["items"]:
            self.assertFalse(item.is_read)

    def test_16_duplicate_recipients_avoided(self):
        """Verify that duplicate recipient IDs in batch notifications do not create duplicate records."""
        notifs = create_notifications_for_users(
            db=self.db,
            recipient_ids=[self.alice.id, self.alice.id, self.bob.id, self.bob.id],
            notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
            title="Batch deduplication test",
            message="Testing deduplication",
        )
        self.assertEqual(len(notifs), 2)
        alice_items = [n for n in notifs if n.recipient_id == self.alice.id]
        bob_items = [n for n in notifs if n.recipient_id == self.bob.id]
        self.assertEqual(len(alice_items), 1)
        self.assertEqual(len(bob_items), 1)

    def test_17_self_notification_avoided_with_exclude_user_id(self):
        """Verify that an actor cannot receive self-notifications when exclude_user_id is passed."""
        notifs = create_notifications_for_users(
            db=self.db,
            recipient_ids=[self.alice.id, self.bob.id],
            notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
            title="Self-notification test",
            message="Submitting actor must not be notified",
            exclude_user_id=self.alice.id,
        )
        recipients = [n.recipient_id for n in notifs]
        self.assertNotIn(self.alice.id, recipients)
        self.assertIn(self.bob.id, recipients)

    def test_18_correct_notification_type_and_decision_id_stored(self):
        """Verify that notification_type, title, message, and decision_id are accurately persisted."""
        decision = self._create_decision("Audit Decision")
        notif = create_notification(
            db=self.db,
            recipient_id=self.alice.id,
            notification_type=NotificationTypeEnum.DOCUMENT_UPLOADED,
            title="Design Doc Attached",
            message="Spec v2 uploaded",
            decision_id=decision.id,
        )
        fetched = get_notification_by_id(db=self.db, notification_id=notif.id, current_user=self.alice)
        self.assertEqual(fetched.notification_type, NotificationTypeEnum.DOCUMENT_UPLOADED.value)
        self.assertEqual(fetched.decision_id, decision.id)
        self.assertEqual(fetched.action_url, f"/decisions/{decision.id}")

    def test_19_api_endpoint_list_and_unread_count(self):
        """Verify FastAPI route handlers for list and unread-count."""
        from app.api.routes.notifications import get_unread_notification_count, list_notifications

        create_notification(
            db=self.db,
            recipient_id=self.alice.id,
            notification_type=NotificationTypeEnum.DECISION_SUBMITTED,
            title="API Test Notif",
            message="Testing route function",
        )

        res = list_notifications(
            page=1,
            page_size=20,
            unread_only=False,
            db=self.db,
            current_user=self.alice,
        )
        self.assertGreaterEqual(res["total"], 1)
        self.assertEqual(res["items"][0].title, "API Test Notif")

        count_res = get_unread_notification_count(
            db=self.db,
            current_user=self.alice,
        )
        self.assertGreaterEqual(count_res["unread_count"], 1)

    def test_20_api_endpoint_mark_read_and_read_all(self):
        """Verify FastAPI route handlers for mark-single-read and mark-all-as-read."""
        from app.api.routes.notifications import mark_all_as_read, mark_single_as_read

        notif = create_notification(
            db=self.db,
            recipient_id=self.alice.id,
            notification_type=NotificationTypeEnum.DECISION_UPDATED,
            title="Mark Read Route",
            message="Testing route single read",
        )
        read_res = mark_single_as_read(
            notification_id=notif.id,
            db=self.db,
            current_user=self.alice,
        )
        self.assertTrue(read_res.is_read)

        # Create another notification and test mark_all_as_read
        create_notification(
            db=self.db,
            recipient_id=self.alice.id,
            notification_type=NotificationTypeEnum.DECISION_UPDATED,
            title="Mark Read-All Route",
            message="Testing route read all",
        )
        all_res = mark_all_as_read(
            db=self.db,
            current_user=self.alice,
        )
        self.assertEqual(all_res["updated_count"], 1)

    def test_21_unauthenticated_request_rejected(self):
        """Verify that requests without valid credentials are rejected with HTTP 401."""
        from fastapi.security import HTTPAuthorizationCredentials
        from app.core.dependencies import get_current_user

        # 1. Missing credentials
        with self.assertRaises(HTTPException) as cm:
            get_current_user(credentials=None, db=self.db)
        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Malformed token string
        bad_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.structure")
        with self.assertRaises(HTTPException) as cm:
            get_current_user(credentials=bad_creds, db=self.db)
        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)


if __name__ == "__main__":
    unittest.main(verbosity=2)
