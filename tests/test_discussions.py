"""
Test Suite: Milestone 2 - Discussion Module
Tests comment creation, validation (empty, whitespace, max length),
threaded replies, editing, author & admin deletion, RBAC checks, and cascade deletion.
"""

import os
import sys
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException, status
from pydantic import ValidationError

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.decision import Decision, DecisionStatusEnum
from app.models.discussion import Discussion
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.decision_service import create_decision, delete_decision
from app.services.discussion_service import (
    create_discussion,
    delete_discussion,
    get_discussion_by_id,
    get_discussions_for_decision,
    update_discussion,
    validate_content,
)
from app.api.routes.discussions import (
    create_decision_discussion,
    create_discussion_reply,
    list_decision_discussions,
    patch_discussion,
    remove_discussion,
)
from app.schemas.decision import DecisionCreateRequest
from app.schemas.discussion import DiscussionCreate, DiscussionUpdate


class TestDiscussions(unittest.TestCase):
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

        # Seed test users
        emp_role = self.db.query(Role).filter(Role.name == RoleEnum.EMPLOYEE.value).first()
        rev_role = self.db.query(Role).filter(Role.name == RoleEnum.REVIEWER.value).first()
        adm_role = self.db.query(Role).filter(Role.name == RoleEnum.ADMINISTRATOR.value).first()

        self.alice = self.db.query(User).filter(User.email == "alice_disc@test.com").first()
        if not self.alice:
            self.alice = User(full_name="Alice Employee", email="alice_disc@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.alice)

        self.bob = self.db.query(User).filter(User.email == "bob_disc@test.com").first()
        if not self.bob:
            self.bob = User(full_name="Bob Employee", email="bob_disc@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.bob)

        self.reviewer = self.db.query(User).filter(User.email == "reviewer_disc@test.com").first()
        if not self.reviewer:
            self.reviewer = User(full_name="Charlie Reviewer", email="reviewer_disc@test.com", hashed_password="hash", role_id=rev_role.id)
            self.db.add(self.reviewer)

        self.admin = self.db.query(User).filter(User.email == "admin_disc@test.com").first()
        if not self.admin:
            self.admin = User(full_name="Dave Admin", email="admin_disc@test.com", hashed_password="hash", role_id=adm_role.id)
            self.db.add(self.admin)

        self.db.commit()

        # Create test draft decision owned by Alice
        dec_req = DecisionCreateRequest(
            title="Database Architecture Decision",
            problem_statement="Choose between PostgreSQL and MongoDB",
            context="Relational vs document store for ACID transactions",
            decision_taken="PostgreSQL with jsonb",
            reasoning="Postgres provides ACID compliance and flexible JSON querying",
        )
        self.decision = create_decision(self.db, dec_req, self.alice.id)

    def tearDown(self):
        self.db.close()

    def test_01_create_comment_authenticated(self):
        """Test authenticated user can post a top-level comment to an accessible decision."""
        req = DiscussionCreate(content="I agree with choosing PostgreSQL for ACID compliance.")
        comment = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=req,
            db=self.db,
            current_user=self.alice
        )

        self.assertIsNotNone(comment.id)
        self.assertEqual(comment.content, "I agree with choosing PostgreSQL for ACID compliance.")
        self.assertEqual(comment.user_id, self.alice.id)
        self.assertEqual(comment.user.full_name, "Alice Employee")
        self.assertIsNone(comment.parent_id)

    def test_02_empty_comment_rejected(self):
        """Test that empty comment content is rejected by schema validation and service validation."""
        # Pydantic schema validation rejects empty string
        with self.assertRaises(ValidationError):
            DiscussionCreate(content="")

        # Service level validation also rejects empty content with HTTP 400
        with self.assertRaises(HTTPException) as ctx:
            validate_content("")
        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Comment content cannot be empty", ctx.exception.detail)

    def test_03_whitespace_only_comment_rejected(self):
        """Test that whitespace-only comment is rejected with HTTP 400."""
        req = DiscussionCreate(content="   \n\t  ")
        with self.assertRaises(HTTPException) as ctx:
            create_decision_discussion(
                decision_id=self.decision.id,
                discussion_in=req,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Comment content cannot be empty or whitespace-only", ctx.exception.detail)

    def test_04_max_length_validation(self):
        """Test that comment exceeding 2000 characters is rejected by schema and service."""
        long_content = "x" * 2001
        with self.assertRaises(ValidationError):
            DiscussionCreate(content=long_content)

        with self.assertRaises(HTTPException) as ctx:
            validate_content(long_content)
        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds maximum limit of 2000", ctx.exception.detail)

    def test_05_list_discussions_tree(self):
        """Test listing comments returns top-level comments and nested replies correctly."""
        # Add comment
        c1 = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Top level comment 1"),
            db=self.db,
            current_user=self.alice
        )
        # Add reply
        r1 = create_discussion_reply(
            decision_id=self.decision.id,
            discussion_id=c1.id,
            reply_in=DiscussionCreate(content="Reply to comment 1"),
            db=self.db,
            current_user=self.alice
        )

        comments = list_decision_discussions(decision_id=self.decision.id, db=self.db, current_user=self.alice)
        self.assertGreaterEqual(len(comments), 1)
        found = next((c for c in comments if c.id == c1.id), None)
        self.assertIsNotNone(found)
        self.assertEqual(len(found.replies), 1)
        self.assertEqual(found.replies[0].id, r1.id)
        self.assertEqual(found.replies[0].content, "Reply to comment 1")

    def test_06_create_threaded_reply(self):
        """Test creating a reply to an existing parent comment."""
        parent = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Parent discussion topic"),
            db=self.db,
            current_user=self.alice
        )

        reply_req = DiscussionCreate(content="Threaded response")
        reply = create_discussion_reply(
            decision_id=self.decision.id,
            discussion_id=parent.id,
            reply_in=reply_req,
            db=self.db,
            current_user=self.admin
        )

        self.assertIsNotNone(reply.id)
        self.assertEqual(reply.parent_id, parent.id)
        self.assertEqual(reply.user_id, self.admin.id)
        self.assertEqual(reply.content, "Threaded response")

    def test_07_invalid_parent_id_rejected(self):
        """Test reply to non-existent parent comment returns 404."""
        reply_req = DiscussionCreate(content="Orphan reply")
        with self.assertRaises(HTTPException) as ctx:
            create_discussion_reply(
                decision_id=self.decision.id,
                discussion_id=999999,
                reply_in=reply_req,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found in decision", ctx.exception.detail)

    def test_08_parent_different_decision_rejected(self):
        """Test reply where parent comment belongs to a different decision is rejected with 404."""
        other_dec_req = DecisionCreateRequest(
            title="Other Decision",
            problem_statement="Other problem",
            context="Other context",
            decision_taken="Other decision",
            reasoning="Other rationale",
        )
        other_dec = create_decision(self.db, other_dec_req, self.alice.id)

        other_comment = create_decision_discussion(
            decision_id=other_dec.id,
            discussion_in=DiscussionCreate(content="Comment on other decision"),
            db=self.db,
            current_user=self.alice
        )

        reply_req = DiscussionCreate(content="Cross-decision reply attempt")
        with self.assertRaises(HTTPException) as ctx:
            create_discussion_reply(
                decision_id=self.decision.id,
                discussion_id=other_comment.id,
                reply_in=reply_req,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found in decision", ctx.exception.detail)

    def test_09_author_can_edit_comment(self):
        """Test author can update their own comment content."""
        c = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Original comment content"),
            db=self.db,
            current_user=self.alice
        )

        updated = patch_discussion(
            decision_id=self.decision.id,
            discussion_id=c.id,
            discussion_in=DiscussionUpdate(content="Updated comment content"),
            db=self.db,
            current_user=self.alice
        )
        self.assertEqual(updated.content, "Updated comment content")

    def test_10_non_author_cannot_edit_comment(self):
        """Test user who can access the decision but is not the author cannot edit a comment (403 Forbidden)."""
        # Make decision SUBMITTED so Reviewer can access it
        self.decision.status = DecisionStatusEnum.SUBMITTED.value
        self.db.commit()

        c = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Alice's comment"),
            db=self.db,
            current_user=self.alice
        )

        # Reviewer can view the decision, but cannot edit Alice's comment
        with self.assertRaises(HTTPException) as ctx:
            patch_discussion(
                decision_id=self.decision.id,
                discussion_id=c.id,
                discussion_in=DiscussionUpdate(content="Reviewer tries to modify Alice's comment"),
                db=self.db,
                current_user=self.reviewer
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You can only edit your own comments", ctx.exception.detail)

    def test_11_author_can_delete_comment(self):
        """Test author can delete their own comment."""
        c = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Comment to be deleted by author"),
            db=self.db,
            current_user=self.alice
        )

        remove_discussion(
            decision_id=self.decision.id,
            discussion_id=c.id,
            db=self.db,
            current_user=self.alice
        )
        # Check it is gone
        found = self.db.query(Discussion).filter(Discussion.id == c.id).first()
        self.assertIsNone(found)

    def test_12_non_author_non_admin_cannot_delete(self):
        """Test non-author non-admin user who can view decision cannot delete another user's comment (403 Forbidden)."""
        # Make decision SUBMITTED so Reviewer can access it
        self.decision.status = DecisionStatusEnum.SUBMITTED.value
        self.db.commit()

        c = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Alice's comment"),
            db=self.db,
            current_user=self.alice
        )

        # Reviewer can view the decision, but is not the author and not admin
        with self.assertRaises(HTTPException) as ctx:
            remove_discussion(
                decision_id=self.decision.id,
                discussion_id=c.id,
                db=self.db,
                current_user=self.reviewer
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You do not have permission to delete this comment", ctx.exception.detail)

    def test_13_admin_can_delete_any_comment(self):
        """Test administrator can moderate and delete any comment."""
        c = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Inappropriate comment by Alice"),
            db=self.db,
            current_user=self.alice
        )

        remove_discussion(
            decision_id=self.decision.id,
            discussion_id=c.id,
            db=self.db,
            current_user=self.admin
        )
        found = self.db.query(Discussion).filter(Discussion.id == c.id).first()
        self.assertIsNone(found)

    def test_14_unauthorized_user_cannot_access_draft_discussions(self):
        """Test user without access to a draft decision cannot view or add discussions (403)."""
        with self.assertRaises(HTTPException) as ctx:
            create_decision_discussion(
                decision_id=self.decision.id,
                discussion_in=DiscussionCreate(content="Bob trying to comment on Alice's private draft"),
                db=self.db,
                current_user=self.bob
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

        with self.assertRaises(HTTPException) as ctx:
            list_decision_discussions(
                decision_id=self.decision.id,
                db=self.db,
                current_user=self.bob
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_15_cascade_deletion_on_decision_delete(self):
        """Test all discussions and replies are automatically removed when decision is deleted."""
        # Create a dedicated decision for deletion test
        dec_req = DecisionCreateRequest(
            title="Temporary Decision for Cascade Test",
            problem_statement="Problem",
            context="Context",
            decision_taken="Decision",
            reasoning="Rationale",
        )
        temp_dec = create_decision(self.db, dec_req, self.alice.id)

        c = create_decision_discussion(
            decision_id=temp_dec.id,
            discussion_in=DiscussionCreate(content="Comment to be cascaded"),
            db=self.db,
            current_user=self.alice
        )
        r = create_discussion_reply(
            decision_id=temp_dec.id,
            discussion_id=c.id,
            reply_in=DiscussionCreate(content="Child reply to be cascaded"),
            db=self.db,
            current_user=self.alice
        )

        # Delete decision
        delete_decision(self.db, temp_dec.id, self.alice)

        # Verify comments are deleted
        c_found = self.db.query(Discussion).filter(Discussion.id == c.id).first()
        r_found = self.db.query(Discussion).filter(Discussion.id == r.id).first()
        self.assertIsNone(c_found)
        self.assertIsNone(r_found)

    def test_16_cascade_deletion_on_parent_comment_delete(self):
        """Test child replies are deleted when parent comment is deleted."""
        parent = create_decision_discussion(
            decision_id=self.decision.id,
            discussion_in=DiscussionCreate(content="Parent with multiple replies"),
            db=self.db,
            current_user=self.alice
        )
        reply = create_discussion_reply(
            decision_id=self.decision.id,
            discussion_id=parent.id,
            reply_in=DiscussionCreate(content="Reply to be cascaded with parent"),
            db=self.db,
            current_user=self.alice
        )

        remove_discussion(
            decision_id=self.decision.id,
            discussion_id=parent.id,
            db=self.db,
            current_user=self.alice
        )

        self.assertIsNone(self.db.query(Discussion).filter(Discussion.id == parent.id).first())
        self.assertIsNone(self.db.query(Discussion).filter(Discussion.id == reply.id).first())


if __name__ == "__main__":
    unittest.main()
