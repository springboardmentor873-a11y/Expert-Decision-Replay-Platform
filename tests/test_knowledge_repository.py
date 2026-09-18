import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag, DecisionTag
from app.models.decision import Decision, DecisionStatusEnum
from app.schemas.decision import DecisionCreateRequest
from app.services.decision_service import create_decision, archive_decision
from app.services.category_service import create_category
from app.schemas.category import CategoryCreateRequest
from app.services.knowledge_repository_service import get_knowledge_repository


class TestKnowledgeRepository(unittest.TestCase):
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
        self.emp_user = User(
            id=2, email="emp@test.com", full_name="Employee User",
            hashed_password="hashed_password", role_id=2, is_active=True,
        )
        self.db.add_all([self.admin_user, self.emp_user])
        self.db.commit()

        cat = create_category(self.db, CategoryCreateRequest(name="DevOps"), self.admin_user)
        self.cat_id = cat["id"]

        self.tag = Tag(name="Kubernetes")
        self.db.add(self.tag)
        self.db.commit()

        # Create approved decision
        d1 = create_decision(
            self.db,
            DecisionCreateRequest(
                title="Migrate to ArgoCD",
                problem_statement="GitOps deployment continuous delivery",
                context="Microservices architecture",
                decision_taken="Adopt ArgoCD",
                reasoning="Declarative Kubernetes deployments",
                category_id=self.cat_id,
            ),
            self.emp_user.id
        )
        d1.status = DecisionStatusEnum.APPROVED.value
        self.db.commit()

        dt = DecisionTag(decision_id=d1.id, tag_id=self.tag.id)
        self.db.add(dt)
        self.db.commit()

        # Create archived decision
        d2 = create_decision(
            self.db,
            DecisionCreateRequest(
                title="Legacy Jenkins Pipeline",
                problem_statement="Decommission legacy CI",
                context="Old build server",
                decision_taken="Retire Jenkins",
                reasoning="Replaced by modern GitHub actions",
            ),
            self.emp_user.id
        )
        archive_decision(self.db, d2.id, self.emp_user)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_search_by_query(self):
        repo = get_knowledge_repository(self.db, self.admin_user, search="ArgoCD")
        self.assertEqual(repo["total"], 1)
        self.assertEqual(repo["decisions"][0]["title"], "Migrate to ArgoCD")

    def test_filter_by_category(self):
        repo = get_knowledge_repository(self.db, self.admin_user, category_id=self.cat_id)
        self.assertEqual(repo["total"], 1)
        self.assertEqual(repo["decisions"][0]["category_name"], "DevOps")

    def test_filter_by_tag(self):
        repo = get_knowledge_repository(self.db, self.admin_user, tag_id=self.tag.id)
        self.assertEqual(repo["total"], 1)
        self.assertEqual(repo["decisions"][0]["title"], "Migrate to ArgoCD")

    def test_filter_by_archived_status(self):
        repo = get_knowledge_repository(self.db, self.admin_user, status_filter="Archived")
        self.assertEqual(repo["total"], 1)
        self.assertEqual(repo["decisions"][0]["title"], "Legacy Jenkins Pipeline")


if __name__ == "__main__":
    unittest.main()
