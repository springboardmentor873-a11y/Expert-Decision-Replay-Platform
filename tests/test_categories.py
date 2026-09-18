import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.database.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest
from app.services.category_service import (
    create_category,
    delete_category,
    get_categories,
    get_category_by_id,
    update_category,
)


class TestCategories(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Seed roles
        self.admin_role = Role(id=1, name=RoleEnum.ADMINISTRATOR.value, description="Admin")
        self.mgr_role = Role(id=2, name=RoleEnum.MANAGER.value, description="Manager")
        self.emp_role = Role(id=3, name=RoleEnum.EMPLOYEE.value, description="Employee")
        self.db.add_all([self.admin_role, self.mgr_role, self.emp_role])
        self.db.commit()

        # Seed test users
        self.admin_user = User(
            id=1,
            email="admin@test.com",
            full_name="Admin User",
            hashed_password="hashed_password",
            role_id=1,
            is_active=True,
        )
        self.emp_user = User(
            id=2,
            email="emp@test.com",
            full_name="Employee User",
            hashed_password="hashed_password",
            role_id=3,
            is_active=True,
        )
        self.db.add_all([self.admin_user, self.emp_user])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_create_category_success(self):
        cat_in = CategoryCreateRequest(name="Architecture", description="Architectural Decisions")
        cat = create_category(self.db, cat_in, self.admin_user)
        self.assertEqual(cat["name"], "Architecture")
        self.assertEqual(cat["description"], "Architectural Decisions")
        self.assertEqual(cat["created_by"], self.admin_user.id)

    def test_create_duplicate_category_fails(self):
        cat_in = CategoryCreateRequest(name="Security", description="Security Decisions")
        create_category(self.db, cat_in, self.admin_user)

        with self.assertRaises(HTTPException) as ctx:
            create_category(self.db, cat_in, self.admin_user)
        self.assertEqual(ctx.exception.status_code, 409)

    def test_update_category(self):
        cat = create_category(self.db, CategoryCreateRequest(name="Infra"), self.admin_user)
        updated = update_category(self.db, cat["id"], CategoryUpdateRequest(name="Infrastructure", description="Cloud & Infra"), self.admin_user)
        self.assertEqual(updated["name"], "Infrastructure")
        self.assertEqual(updated["description"], "Cloud & Infra")

    def test_delete_category(self):
        cat = create_category(self.db, CategoryCreateRequest(name="Temporary"), self.admin_user)
        cat_id = cat["id"]
        delete_category(self.db, cat_id, self.admin_user)

        with self.assertRaises(HTTPException) as ctx:
            get_category_by_id(self.db, cat_id)
        self.assertEqual(ctx.exception.status_code, 404)

    def test_list_categories(self):
        create_category(self.db, CategoryCreateRequest(name="Finance"), self.admin_user)
        create_category(self.db, CategoryCreateRequest(name="HR"), self.admin_user)
        cats = get_categories(self.db)
        self.assertEqual(len(cats), 2)
        names = [c["name"] for c in cats]
        self.assertIn("Finance", names)
        self.assertIn("HR", names)


if __name__ == "__main__":
    unittest.main()
