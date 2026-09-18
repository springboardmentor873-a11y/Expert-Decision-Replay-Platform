import os
import sys
import unittest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.audit_log import AuditLog, AuditActionEnum
from app.models.role import Role, RoleEnum
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreateRequest, TeamMemberAddRequest, TeamUpdateRequest
from app.services import team_service


class TestTeamsModule(unittest.TestCase):
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
        self.role_emp = Role(id=1, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.role_rev = Role(id=2, name=RoleEnum.REVIEWER.value, description="Reviewer")
        self.role_mgr = Role(id=3, name=RoleEnum.MANAGER.value, description="Manager")
        self.role_adm = Role(id=4, name=RoleEnum.ADMINISTRATOR.value, description="Administrator")
        self.db.add_all([self.role_emp, self.role_rev, self.role_mgr, self.role_adm])
        self.db.commit()

        # Seed Users
        self.user_emp1 = User(id=1, full_name="Alice Employee", email="alice@test.com", hashed_password="pw", role_id=1, is_active=True)
        self.user_emp2 = User(id=2, full_name="Bob Employee", email="bob@test.com", hashed_password="pw", role_id=1, is_active=True)
        self.user_mgr = User(id=3, full_name="Charlie Manager", email="charlie@test.com", hashed_password="pw", role_id=3, is_active=True)
        self.user_adm = User(id=4, full_name="Diana Admin", email="diana@test.com", hashed_password="pw", role_id=4, is_active=True)
        self.db.add_all([self.user_emp1, self.user_emp2, self.user_mgr, self.user_adm])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_create_team_success(self):
        team_in = TeamCreateRequest(name="Core Architecture", description="Design system and core arch")
        team = team_service.create_team(self.db, team_in, self.user_emp1)
        self.assertIsNotNone(team.id)
        self.assertEqual(team.name, "Core Architecture")
        self.assertEqual(team.created_by, self.user_emp1.id)
        self.assertEqual(team.member_count, 1)
        self.assertEqual(team.members[0].user_id, self.user_emp1.id)
        self.assertEqual(team.members[0].role, "Lead")

        # Verify audit log
        audit = self.db.query(AuditLog).filter(AuditLog.action == AuditActionEnum.TEAM_CREATED.value).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.user_id, self.user_emp1.id)

    def test_create_team_with_purpose(self):
        team_in = TeamCreateRequest(
            name="Platform Squad",
            description="Focuses on distributed resilience.",
            purpose="Standardize cloud architecture and observability."
        )
        team = team_service.create_team(self.db, team_in, self.user_mgr)
        self.assertIsNotNone(team.id)
        self.assertEqual(team.name, "Platform Squad")
        self.assertIn("Purpose: Standardize cloud architecture", team.description)
        self.assertIn("Focuses on distributed resilience.", team.description)

    def test_create_team_duplicate_name_fails(self):
        team_in = TeamCreateRequest(name="DevOps Team", description="Platform engineering")
        team_service.create_team(self.db, team_in, self.user_mgr)

        with self.assertRaises(HTTPException) as ctx:
            team_service.create_team(self.db, team_in, self.user_emp1)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_get_teams_list(self):
        team_service.create_team(self.db, TeamCreateRequest(name="Team A"), self.user_emp1)
        team_service.create_team(self.db, TeamCreateRequest(name="Team B"), self.user_mgr)

        teams = team_service.get_teams(self.db, self.user_emp1)
        self.assertEqual(len(teams), 2)
        names = [t.name for t in teams]
        self.assertIn("Team A", names)
        self.assertIn("Team B", names)

    def test_get_team_by_id_success_and_not_found(self):
        created = team_service.create_team(self.db, TeamCreateRequest(name="Frontend Team"), self.user_emp1)
        fetched = team_service.get_team_by_id(self.db, created.id, self.user_emp1)
        self.assertEqual(fetched.id, created.id)
        self.assertEqual(fetched.name, "Frontend Team")

        with self.assertRaises(HTTPException) as ctx:
            team_service.get_team_by_id(self.db, 9999, self.user_emp1)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_update_team_authorization(self):
        team = team_service.create_team(self.db, TeamCreateRequest(name="Backend Team"), self.user_emp1)

        # Creator/Lead can update
        updated = team_service.update_team(self.db, team.id, TeamUpdateRequest(description="New desc"), self.user_emp1)
        self.assertEqual(updated.description, "New desc")

        # Admin can update
        updated_by_admin = team_service.update_team(self.db, team.id, TeamUpdateRequest(name="Backend Engineering"), self.user_adm)
        self.assertEqual(updated_by_admin.name, "Backend Engineering")

        # Unauthorized employee cannot update
        with self.assertRaises(HTTPException) as ctx:
            team_service.update_team(self.db, team.id, TeamUpdateRequest(name="Hacked Name"), self.user_emp2)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_delete_team_authorization(self):
        team = team_service.create_team(self.db, TeamCreateRequest(name="Temporary Team"), self.user_emp1)

        # Unauthorized employee cannot delete
        with self.assertRaises(HTTPException) as ctx:
            team_service.delete_team(self.db, team.id, self.user_emp2)
        self.assertEqual(ctx.exception.status_code, 403)

        # Manager can delete
        team_service.delete_team(self.db, team.id, self.user_mgr)
        self.assertIsNone(self.db.query(Team).filter(Team.id == team.id).first())

    def test_add_and_remove_member_flow(self):
        team = team_service.create_team(self.db, TeamCreateRequest(name="Data Analytics"), self.user_mgr)

        # Add Bob
        member = team_service.add_team_member(
            self.db,
            team.id,
            TeamMemberAddRequest(user_id=self.user_emp2.id, role="Member"),
            self.user_mgr
        )
        self.assertEqual(member.user_id, self.user_emp2.id)
        self.assertEqual(member.role, "Member")

        # Duplicate addition fails
        with self.assertRaises(HTTPException) as ctx:
            team_service.add_team_member(
                self.db,
                team.id,
                TeamMemberAddRequest(user_id=self.user_emp2.id, role="Member"),
                self.user_mgr
            )
        self.assertEqual(ctx.exception.status_code, 409)

        # Non-existent user addition fails
        with self.assertRaises(HTTPException) as ctx:
            team_service.add_team_member(
                self.db,
                team.id,
                TeamMemberAddRequest(user_id=9999, role="Member"),
                self.user_mgr
            )
        self.assertEqual(ctx.exception.status_code, 404)

        # Remove Bob
        team_service.remove_team_member(self.db, team.id, self.user_emp2.id, self.user_mgr)
        remaining = self.db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == self.user_emp2.id).first()
        self.assertIsNone(remaining)


if __name__ == "__main__":
    unittest.main()
