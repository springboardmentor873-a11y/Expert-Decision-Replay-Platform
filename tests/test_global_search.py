import os
import sys
import unittest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.decision import Decision, DecisionStatusEnum
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services import decision_service


class TestGlobalSearchModule(unittest.TestCase):
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
        self.role_adm = Role(id=3, name=RoleEnum.ADMINISTRATOR.value, description="Administrator")
        self.db.add_all([self.role_emp, self.role_rev, self.role_adm])
        self.db.commit()

        # Seed Users
        self.user_emp = User(id=1, full_name="Alice Employee", email="alice@test.com", hashed_password="pw", role_id=1, is_active=True)
        self.user_other = User(id=2, full_name="Bob Employee", email="bob@test.com", hashed_password="pw", role_id=1, is_active=True)
        self.user_rev = User(id=3, full_name="Charlie Reviewer", email="charlie@test.com", hashed_password="pw", role_id=2, is_active=True)
        self.user_adm = User(id=4, full_name="Diana Admin", email="diana@test.com", hashed_password="pw", role_id=3, is_active=True)
        self.db.add_all([self.user_emp, self.user_other, self.user_rev, self.user_adm])
        self.db.commit()

        # Seed Decisions
        # 1. Alice Draft: "Microservices Architecture Migration"
        self.dec1 = Decision(
            id=1,
            title="Microservices Architecture Migration",
            problem_statement="Monolith bottleneck in production payment cluster",
            context="Kubernetes adoption project",
            decision_taken="Split payment into independent microservice",
            reasoning="Improves reliability and throughput",
            status=DecisionStatusEnum.DRAFT.value,
            created_by=self.user_emp.id,
        )
        # 2. Bob Draft: "Database Sharding Architecture" (private to Bob)
        self.dec2 = Decision(
            id=2,
            title="Database Sharding Architecture",
            problem_statement="High IOPS latency on main PostgreSQL instance",
            context="Scalability roadmap",
            decision_taken="Shard by tenant ID",
            reasoning="Distributes read/write load",
            status=DecisionStatusEnum.DRAFT.value,
            created_by=self.user_other.id,
        )
        # 3. Bob Approved: "Redis Cache Implementation" (public to all reviewers/managers/admin)
        self.dec3 = Decision(
            id=3,
            title="Redis Cache Implementation",
            problem_statement="Session lookup latency too high in Redis cluster",
            context="Performance optimization",
            decision_taken="Deploy Redis cluster for distributed caching",
            reasoning="Reduces DB roundtrips",
            status=DecisionStatusEnum.APPROVED.value,
            created_by=self.user_other.id,
        )
        self.db.add_all([self.dec1, self.dec2, self.dec3])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_search_by_title(self):
        # Admin searches "Microservices"
        results = decision_service.get_decisions(self.db, self.user_adm, search="microservices")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec1.id)

    def test_search_by_problem_statement(self):
        # Admin searches "bottleneck"
        results = decision_service.get_decisions(self.db, self.user_adm, search="bottleneck")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec1.id)

    def test_search_by_context(self):
        # Admin searches "Kubernetes"
        results = decision_service.get_decisions(self.db, self.user_adm, search="kubernetes")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec1.id)

    def test_search_by_decision_taken(self):
        # Admin searches "tenant ID"
        results = decision_service.get_decisions(self.db, self.user_adm, search="tenant id")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec2.id)

    def test_search_by_status(self):
        # Admin searches "Approved"
        results = decision_service.get_decisions(self.db, self.user_adm, search="Approved")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec3.id)

    def test_search_respects_employee_rbac(self):
        # Alice searches "Architecture"
        # dec1 is Alice's draft ("Microservices Architecture Migration")
        # dec2 is Bob's draft ("Database Sharding Architecture") - Alice MUST NOT see Bob's draft!
        results = decision_service.get_decisions(self.db, self.user_emp, search="Architecture")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec1.id)

    def test_search_respects_reviewer_rbac(self):
        # Reviewer searches "Architecture"
        # Should NOT see Alice's draft or Bob's draft
        results = decision_service.get_decisions(self.db, self.user_rev, search="Architecture")
        self.assertEqual(len(results), 0)

        # Reviewer searches "Redis" (Approved)
        results = decision_service.get_decisions(self.db, self.user_rev, search="Redis")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].id, self.dec3.id)

    def test_search_admin_sees_all_matches(self):
        # Admin searches "Architecture"
        # Admin sees both Alice's draft and Bob's draft
        results = decision_service.get_decisions(self.db, self.user_adm, search="Architecture")
        self.assertEqual(len(results), 2)
        ids = [r.id for r in results]
        self.assertIn(self.dec1.id, ids)
        self.assertIn(self.dec2.id, ids)


if __name__ == "__main__":
    unittest.main()
