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
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.team_join_request import TeamJoinRequest
from app.models.category import Category
from app.models.tag import Tag, DecisionTag
from app.models.decision import Decision, DecisionStatusEnum
from app.models.alternative import Alternative
from app.schemas.team import TeamCreateRequest
from app.schemas.team_join_request import TeamJoinRequestCreate, TeamJoinRequestReview
from app.services import team_service
from app.services.knowledge_repository_service import get_knowledge_graph_data, get_related_insights


class TestDemoAndTeamsEnhancements(unittest.TestCase):
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
        self.user_emp1 = User(id=1, full_name="Alice Member", email="alice@test.com", hashed_password="pw", role_id=1, is_active=True)
        self.user_emp2 = User(id=2, full_name="Bob Requester", email="bob@test.com", hashed_password="pw", role_id=1, is_active=True)
        self.user_lead = User(id=3, full_name="Charlie Lead", email="charlie@test.com", hashed_password="pw", role_id=3, is_active=True)
        self.user_adm = User(id=4, full_name="Diana Admin", email="diana@test.com", hashed_password="pw", role_id=4, is_active=True)
        self.db.add_all([self.user_emp1, self.user_emp2, self.user_lead, self.user_adm])
        self.db.commit()

        # Create Team
        self.team = Team(
            name="Platform Squad",
            description="Core platform infrastructure and reliable microservices",
            created_by=self.user_lead.id,
        )
        self.db.add(self.team)
        self.db.commit()

        # Add Lead and Alice as Member
        self.lead_member = TeamMember(team_id=self.team.id, user_id=self.user_lead.id, role="Lead")
        self.alice_member = TeamMember(team_id=self.team.id, user_id=self.user_emp1.id, role="Member")
        self.db.add_all([self.lead_member, self.alice_member])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_get_my_teams(self):
        # Alice is in Platform Squad
        alice_teams = team_service.get_my_teams(self.db, self.user_emp1)
        self.assertEqual(len(alice_teams), 1)
        self.assertEqual(alice_teams[0].id, self.team.id)

        # Bob is not in any team yet
        bob_teams = team_service.get_my_teams(self.db, self.user_emp2)
        self.assertEqual(len(bob_teams), 0)

    def test_create_join_request_success(self):
        req_in = TeamJoinRequestCreate(message="I want to join to help with reliability.")
        resp = team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp2)
        self.assertIsNotNone(resp.id)
        self.assertEqual(resp.team_id, self.team.id)
        self.assertEqual(resp.user_id, self.user_emp2.id)
        self.assertEqual(resp.status, "PENDING")
        self.assertEqual(resp.message, "I want to join to help with reliability.")

    def test_create_join_request_duplicate_conflict(self):
        req_in = TeamJoinRequestCreate(message="Request 1")
        team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp2)

        # Re-request should fail with 409 Conflict
        with self.assertRaises(HTTPException) as ctx:
            team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp2)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_create_join_request_already_member_conflict(self):
        # Alice is already a member
        req_in = TeamJoinRequestCreate(message="Alice request")
        with self.assertRaises(HTTPException) as ctx:
            team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp1)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_review_join_request_approve(self):
        req_in = TeamJoinRequestCreate(message="Please approve")
        req = team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp2)

        # Lead approves request
        review_in = TeamJoinRequestReview(action="APPROVE")
        reviewed = team_service.review_join_request(self.db, req.id, review_in, self.user_lead)
        self.assertEqual(reviewed.status, "APPROVED")
        self.assertEqual(reviewed.reviewed_by, self.user_lead.id)

        # Check that Bob is now an active member
        member = self.db.query(TeamMember).filter(
            TeamMember.team_id == self.team.id,
            TeamMember.user_id == self.user_emp2.id
        ).first()
        self.assertIsNotNone(member)
        self.assertEqual(member.role, "Member")

    def test_review_join_request_reject(self):
        req_in = TeamJoinRequestCreate(message="Please approve")
        req = team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp2)

        # Lead rejects request
        review_in = TeamJoinRequestReview(action="REJECT")
        reviewed = team_service.review_join_request(self.db, req.id, review_in, self.user_lead)
        self.assertEqual(reviewed.status, "REJECTED")

        # Check Bob was NOT added to team
        member = self.db.query(TeamMember).filter(
            TeamMember.team_id == self.team.id,
            TeamMember.user_id == self.user_emp2.id
        ).first()
        self.assertIsNone(member)

    def test_review_join_request_unauthorized_forbidden(self):
        req_in = TeamJoinRequestCreate(message="Please approve")
        req = team_service.create_join_request(self.db, self.team.id, req_in, self.user_emp2)

        # Alice (regular member, not lead or manager) tries to approve
        review_in = TeamJoinRequestReview(action="APPROVE")
        with self.assertRaises(HTTPException) as ctx:
            team_service.review_join_request(self.db, req.id, review_in, self.user_emp1)
        self.assertEqual(ctx.exception.status_code, 403)

    def test_knowledge_graph_and_insights(self):
        # Create Category & Decision with Alternative
        cat = Category(name="Architecture", description="Core arch")
        self.db.add(cat)
        self.db.commit()

        dec = Decision(
            title="FastAPI Migration",
            problem_statement="Monolith coupling",
            context="High scale",
            decision_taken="Adopt FastAPI",
            reasoning="Performance",
            expected_outcome="Low latency",
            status=DecisionStatusEnum.APPROVED.value,
            category_id=cat.id,
            team_id=self.team.id,
            created_by=self.user_lead.id,
        )
        self.db.add(dec)
        self.db.commit()

        alt = Alternative(
            decision_id=dec.id,
            name="FastAPI Services",
            description="Microservices async",
            pros="Speed",
            cons="Broker",
            is_selected=True,
        )
        self.db.add(alt)
        self.db.commit()

        graph = get_knowledge_graph_data(self.db, self.user_lead)
        self.assertIn("nodes", graph)
        self.assertIn("links", graph)
        self.assertIn("stats", graph)
        self.assertGreaterEqual(graph["stats"]["decision_nodes"], 1)
        self.assertGreaterEqual(graph["stats"]["category_nodes"], 1)
        self.assertGreaterEqual(graph["stats"]["team_nodes"], 1)

        insights = get_related_insights(self.db, self.user_lead)
        self.assertIn("metrics", insights)
        self.assertIn("top_categories", insights)
        self.assertIn("high_impact_decisions", insights)
        self.assertEqual(insights["metrics"]["total_decisions"], 1)


if __name__ == "__main__":
    unittest.main()
