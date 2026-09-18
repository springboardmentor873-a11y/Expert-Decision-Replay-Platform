import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.decision import Decision, DecisionStatusEnum
from app.schemas.decision import DecisionCreateRequest
from app.services.decision_service import create_decision
from app.services.team_service import create_team
from app.schemas.team import TeamCreateRequest
from app.services.report_service import (
    get_decision_summary_report,
    get_team_report,
    get_audit_report,
    export_report_to_excel,
    export_report_to_pdf,
)


class TestReportExports(unittest.TestCase):
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
        self.db.add(self.admin_user)
        self.db.commit()

        self.team_resp = create_team(self.db, TeamCreateRequest(name="Core Platform"), self.admin_user)

        d1 = create_decision(
            self.db,
            DecisionCreateRequest(
                title="Service Mesh Deployment",
                problem_statement="mTLS and tracing requirements",
                context="Microservices cloud environment",
                decision_taken="Deploy Linkerd",
                reasoning="Lightweight Rust data plane and zero-config mTLS",
                team_id=self.team_resp.id,
            ),
            self.admin_user.id
        )
        d1.status = DecisionStatusEnum.APPROVED.value
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_team_report_generation(self):
        rpt = get_team_report(self.db, self.team_resp.id, self.admin_user)
        self.assertEqual(rpt["team_id"], self.team_resp.id)
        self.assertEqual(rpt["total_decisions"], 1)
        self.assertEqual(rpt["approval_rate"], 100.0)

    def test_audit_report_generation(self):
        rpt = get_audit_report(self.db, self.admin_user)
        self.assertGreaterEqual(rpt["total_records"], 1)
        self.assertIn("items", rpt)

    def test_excel_export_generation(self):
        data = get_decision_summary_report(self.db, self.admin_user)
        xlsx_bytes = export_report_to_excel("summary", data)
        self.assertIsInstance(xlsx_bytes, bytes)
        self.assertGreater(len(xlsx_bytes), 100)
        # OpenXML / xlsx file starts with ZIP PK magic header: b"PK\x03\x04"
        self.assertTrue(xlsx_bytes.startswith(b"PK"))

    def test_pdf_export_generation(self):
        data = get_decision_summary_report(self.db, self.admin_user)
        pdf_bytes = export_report_to_pdf("summary", data)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 100)
        # PDF document starts with %PDF- header
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))


if __name__ == "__main__":
    unittest.main()
