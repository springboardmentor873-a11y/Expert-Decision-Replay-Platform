"""
Test Suite: Demo-Readiness & Seed Integrity Verification
Verifies demo accounts, password hashes, team structures, Nithin Kumar single-team constraint,
Reviewer pending queue, and absence of 'Demo' in user names.
"""

import os
import sys
import unittest

from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))
load_dotenv(env_path)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.security import verify_password
from app.database.database import SessionLocal
from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import Role, RoleEnum
from app.models.team import Team, TeamMember
from app.models.user import User


class TestDemoReadiness(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_dedicated_demo_accounts_exist_and_passwords_valid(self):
        """Verify the 4 dedicated demo accounts exist with correct roles and Demo@123 password."""
        expected = [
            ("nithin.kumar@example.com", "Nithin Kumar", "Employee"),
            ("rahul.sharma@example.com", "Rahul Sharma", "Reviewer"),
            ("priya.reddy@example.com", "Priya Reddy", "Manager"),
            ("arjun.mehta@example.com", "Arjun Mehta", "Administrator"),
        ]
        for email, full_name, role_name in expected:
            user = self.db.query(User).filter(User.email == email).first()
            self.assertIsNotNone(user, f"User with email {email} should exist")
            self.assertEqual(user.full_name, full_name)
            self.assertEqual(user.role.name, role_name)
            self.assertTrue(
                verify_password("Demo@123", user.hashed_password),
                f"Password verification for {email} with Demo@123 must succeed"
            )

    def test_02_no_demo_in_user_display_names(self):
        """Verify none of the active users have 'Demo' in their full_name."""
        users = self.db.query(User).all()
        for u in users:
            self.assertNotIn("Demo", u.full_name, f"User {u.id} has 'Demo' in name: {u.full_name}")

    def test_03_teams_and_nithin_kumar_single_team_constraint(self):
        """Verify teams structure and that Nithin Kumar belongs to EXACTLY 1 team (Product Engineering Team)."""
        nithin = self.db.query(User).filter(User.email == "nithin.kumar@example.com").first()
        self.assertIsNotNone(nithin)

        nithin_memberships = (
            self.db.query(TeamMember)
            .join(Team, TeamMember.team_id == Team.id)
            .filter(TeamMember.user_id == nithin.id)
            .all()
        )
        self.assertEqual(
            len(nithin_memberships),
            1,
            f"Nithin Kumar must belong to EXACTLY 1 team, found: {len(nithin_memberships)}"
        )
        team_name = nithin_memberships[0].team.name
        self.assertEqual(team_name, "Product Engineering Team")

    def test_04_team_leads_and_members(self):
        """Verify leads and memberships for all 3 teams."""
        teams = {t.name: t for t in self.db.query(Team).all()}
        self.assertIn("Product Engineering Team", teams)
        self.assertIn("Cloud Infrastructure Team", teams)
        self.assertIn("Security & Compliance Team", teams)

        # Product Engineering: Lead Priya, Members: Priya, Nithin, Rahul
        pe = teams["Product Engineering Team"]
        pe_member_names = {m.user.full_name for m in pe.members}
        self.assertIn("Nithin Kumar", pe_member_names)
        self.assertIn("Priya Reddy", pe_member_names)
        self.assertIn("Rahul Sharma", pe_member_names)

        # Cloud Infrastructure: Lead Priya, Members: Priya, Arjun
        ci = teams["Cloud Infrastructure Team"]
        ci_member_names = {m.user.full_name for m in ci.members}
        self.assertIn("Priya Reddy", ci_member_names)
        self.assertIn("Arjun Mehta", ci_member_names)

        # Security & Compliance: Lead Arjun, Members: Arjun, Rahul
        sc = teams["Security & Compliance Team"]
        sc_member_names = {m.user.full_name for m in sc.members}
        self.assertIn("Arjun Mehta", sc_member_names)
        self.assertIn("Rahul Sharma", sc_member_names)

    def test_05_reviewer_pending_approvals_decision(self):
        """Verify Decision 6 (PostgreSQL Read Replica Strategy) is Under Review authored by Nithin."""
        d6 = self.db.query(Decision).filter(Decision.id == 6).first()
        self.assertIsNotNone(d6, "Decision ID 6 must exist")
        self.assertEqual(d6.status, DecisionStatusEnum.UNDER_REVIEW.value)
        self.assertTrue(d6.title.startswith("PostgreSQL Read Replica Strategy"))
        nithin = self.db.query(User).filter(User.email == "nithin.kumar@example.com").first()
        self.assertEqual(d6.created_by, nithin.id)

    def test_06_real_data_preservation(self):
        """Verify real users (IDs 1, 2, 3) and real decisions (IDs 1, 2, 3) are preserved intact."""
        u1 = self.db.query(User).filter(User.id == 1).first()
        u2 = self.db.query(User).filter(User.id == 2).first()
        u3 = self.db.query(User).filter(User.id == 3).first()
        self.assertIsNotNone(u1)
        self.assertIsNotNone(u2)
        self.assertIsNotNone(u3)

        d1 = self.db.query(Decision).filter(Decision.id == 1).first()
        d2 = self.db.query(Decision).filter(Decision.id == 2).first()
        d3 = self.db.query(Decision).filter(Decision.id == 3).first()
        self.assertIsNotNone(d1)
        self.assertIsNotNone(d2)
        self.assertIsNotNone(d3)


if __name__ == "__main__":
    unittest.main()
