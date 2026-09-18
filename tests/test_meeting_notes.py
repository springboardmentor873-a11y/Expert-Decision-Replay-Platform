import os
import sys
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.decision import DecisionCreateRequest
from app.schemas.meeting_note import MeetingNoteCreateRequest, MeetingNoteUpdateRequest
from app.services.decision_service import create_decision
from app.services.meeting_note_service import (
    create_meeting_note,
    get_notes_for_decision,
    update_meeting_note,
    delete_meeting_note,
)


class TestMeetingNotes(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.admin_role = Role(id=1, name=RoleEnum.ADMINISTRATOR.value, description="Admin")
        self.emp_role = Role(id=2, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.db.add_all([self.admin_role, self.emp_role])
        self.db.commit()

        self.admin_user = User(
            id=1, email="admin@test.com", full_name="Admin User",
            hashed_password="hashed_password", role_id=1, is_active=True,
        )
        self.author_user = User(
            id=2, email="author@test.com", full_name="Author User",
            hashed_password="hashed_password", role_id=2, is_active=True,
        )
        self.other_user = User(
            id=3, email="other@test.com", full_name="Other User",
            hashed_password="hashed_password", role_id=2, is_active=True,
        )
        self.db.add_all([self.admin_user, self.author_user, self.other_user])
        self.db.commit()

        dec_in = DecisionCreateRequest(
            title="Frontend Tech Stack Selection",
            problem_statement="Choose SPA framework",
            context="Enterprise team with React experience",
            decision_taken="React with Vite",
            reasoning="Vite provides instant HMR and lightweight bundle sizes",
        )
        self.decision = create_decision(self.db, dec_in, self.author_user.id)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_create_meeting_note(self):
        note_in = MeetingNoteCreateRequest(
            title="Initial Architecture Sync",
            notes="Discussed React vs Vue. Team unanimously favored React + Vite.",
            meeting_date=datetime.now(timezone.utc)
        )
        note = create_meeting_note(self.db, self.decision.id, note_in, self.author_user)
        self.assertEqual(note["title"], "Initial Architecture Sync")
        self.assertEqual(note["created_by"], self.author_user.id)

    def test_list_meeting_notes(self):
        create_meeting_note(self.db, self.decision.id, MeetingNoteCreateRequest(title="M1", notes="Notes 1"), self.author_user)
        create_meeting_note(self.db, self.decision.id, MeetingNoteCreateRequest(title="M2", notes="Notes 2"), self.author_user)
        notes = get_notes_for_decision(self.db, self.decision.id, self.author_user)
        self.assertEqual(len(notes), 2)

    def test_update_meeting_note_by_author(self):
        note = create_meeting_note(self.db, self.decision.id, MeetingNoteCreateRequest(title="Original", notes="Some notes"), self.author_user)
        updated = update_meeting_note(
            self.db,
            self.decision.id,
            note["id"],
            MeetingNoteUpdateRequest(title="Updated Title", notes="Updated notes"),
            self.author_user
        )
        self.assertEqual(updated["title"], "Updated Title")
        self.assertEqual(updated["notes"], "Updated notes")

    def test_update_meeting_note_unauthorized(self):
        note = create_meeting_note(self.db, self.decision.id, MeetingNoteCreateRequest(title="Original", notes="Some notes"), self.author_user)
        with self.assertRaises(HTTPException) as ctx:
            update_meeting_note(
                self.db,
                self.decision.id,
                note["id"],
                MeetingNoteUpdateRequest(title="Hacked"),
                self.other_user
            )
        self.assertEqual(ctx.exception.status_code, 403)

    def test_delete_meeting_note(self):
        note = create_meeting_note(self.db, self.decision.id, MeetingNoteCreateRequest(title="To Delete", notes="Content"), self.author_user)
        note_id = note["id"]
        delete_meeting_note(self.db, self.decision.id, note_id, self.author_user)
        notes = get_notes_for_decision(self.db, self.decision.id, self.author_user)
        self.assertEqual(len(notes), 0)


if __name__ == "__main__":
    unittest.main()
