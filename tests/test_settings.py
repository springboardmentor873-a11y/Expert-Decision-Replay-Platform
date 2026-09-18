import os
import sys
import unittest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.security import hash_password, verify_password
from app.database.database import Base
from app.models.audit_log import AuditLog, AuditActionEnum
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.services import user_service


class TestSettingsModule(unittest.TestCase):
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
        self.db.add(self.role_emp)
        self.db.commit()

        # Seed User with known password "InitialPassword123"
        self.test_user = User(
            id=1,
            full_name="Original Name",
            email="user@test.com",
            hashed_password=hash_password("InitialPassword123"),
            role_id=1,
            is_active=True,
        )
        self.db.add(self.test_user)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_update_profile_name(self):
        updated = user_service.update_user_profile(
            self.db,
            user_id=self.test_user.id,
            full_name="Updated Full Name"
        )
        self.assertEqual(updated.full_name, "Updated Full Name")

        # Verify audit log
        audit = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.USER_PROFILE_UPDATED.value
        ).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.user_id, self.test_user.id)
        self.assertIn("Updated Full Name", audit.description)

    def test_change_password_success_and_login(self):
        user_service.change_user_password(
            self.db,
            user_id=self.test_user.id,
            current_password="InitialPassword123",
            new_password="NewSecurePassword456",
        )

        # Refresh user from DB
        refreshed = self.db.query(User).filter(User.id == self.test_user.id).first()
        self.assertTrue(verify_password("NewSecurePassword456", refreshed.hashed_password))
        self.assertFalse(verify_password("InitialPassword123", refreshed.hashed_password))

        # Test authenticate_user with new password
        authed_user = user_service.authenticate_user(
            self.db,
            LoginRequest(email="user@test.com", password="NewSecurePassword456")
        )
        self.assertIsNotNone(authed_user)
        self.assertEqual(authed_user.id, self.test_user.id)

        # Verify audit log
        audit = self.db.query(AuditLog).filter(
            AuditLog.action == AuditActionEnum.USER_PASSWORD_CHANGED.value
        ).first()
        self.assertIsNotNone(audit)

    def test_change_password_invalid_current_password(self):
        with self.assertRaises(HTTPException) as ctx:
            user_service.change_user_password(
                self.db,
                user_id=self.test_user.id,
                current_password="WrongPassword999",
                new_password="NewSecurePassword456",
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Current password is incorrect", ctx.exception.detail)

    def test_change_password_too_short(self):
        with self.assertRaises(HTTPException) as ctx:
            user_service.change_user_password(
                self.db,
                user_id=self.test_user.id,
                current_password="InitialPassword123",
                new_password="short",
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("at least 8 characters", ctx.exception.detail)

    def test_get_user_roster(self):
        roster = user_service.get_user_roster(self.db)
        self.assertEqual(len(roster), 1)
        self.assertEqual(roster[0].email, "user@test.com")
        self.assertEqual(roster[0].role_name, "Employee")


if __name__ == "__main__":
    unittest.main()
