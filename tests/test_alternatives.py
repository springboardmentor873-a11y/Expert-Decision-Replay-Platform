"""
Test Suite: Milestone 2 - Alternative Comparison & Analysis
Tests all CRUD operations, schema validations, single-selected logic,
cascade deletion, and RBAC / ownership restrictions for decision alternatives.
"""

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
from app.models.alternative import Alternative
from app.models.decision import Decision, DecisionStatusEnum
from app.models.decision_version import DecisionVersion
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.alternative import AlternativeCreateRequest, AlternativeUpdateRequest
from app.services.alternative_service import (
    create_alternative,
    delete_alternative,
    get_alternative_by_id,
    get_alternatives,
    update_alternative,
)
from app.services.decision_service import create_decision, submit_decision
from app.schemas.decision import DecisionCreateRequest


class TestAlternatives(unittest.TestCase):
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

        # Seed Users
        emp_role = self.db.query(Role).filter(Role.name == RoleEnum.EMPLOYEE.value).first()
        admin_role = self.db.query(Role).filter(Role.name == RoleEnum.ADMINISTRATOR.value).first()

        self.user_alice = User(
            full_name="Alice Engineer",
            email="alice@company.com",
            hashed_password="fakehashalice",
            role_id=emp_role.id,
            is_active=True
        )
        self.user_bob = User(
            full_name="Bob Engineer",
            email="bob@company.com",
            hashed_password="fakehashbob",
            role_id=emp_role.id,
            is_active=True
        )
        self.user_admin = User(
            full_name="System Admin",
            email="admin@company.com",
            hashed_password="fakehashadmin",
            role_id=admin_role.id,
            is_active=True
        )
        self.db.add_all([self.user_alice, self.user_bob, self.user_admin])
        self.db.commit()
        self.db.refresh(self.user_alice)
        self.db.refresh(self.user_bob)
        self.db.refresh(self.user_admin)

        # Create sample decision owned by Alice
        dec_in = DecisionCreateRequest(
            title="Adopt Messaging Architecture",
            problem_statement="High throughput message pipeline bottlenecks.",
            context="Need horizontal scalability and low latency.",
            decision_taken="Adopt Apache Kafka Cluster",
            reasoning="Handles millions of events/sec with replay capabilities.",
            expected_outcome="Sub-10ms pub/sub latency.",
        )
        self.decision = create_decision(self.db, dec_in, self.user_alice.id)

    def tearDown(self):
        self.db.query(DecisionVersion).delete()
        self.db.query(Alternative).delete()
        self.db.query(Decision).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    def test_01_create_multiple_alternatives(self):
        """Test creating multiple alternatives for a decision."""
        alt1_in = AlternativeCreateRequest(
            name="Apache Kafka",
            description="Distributed event streaming platform.",
            pros="High throughput, event persistence, log replay.",
            cons="Operational complexity, ZooKeeper/KRaft overhead.",
            cost="$1,500/month managed",
            feasibility="High",
            risk_assessment="Requires cluster maintenance training.",
            is_selected=True
        )
        alt1 = create_alternative(self.db, self.decision.id, alt1_in, self.user_alice)
        self.assertIsNotNone(alt1.id)
        self.assertEqual(alt1.name, "Apache Kafka")
        self.assertTrue(alt1.is_selected)

        alt2_in = AlternativeCreateRequest(
            name="RabbitMQ",
            description="Traditional AMQP message broker.",
            pros="Easy setup, advanced routing topologies.",
            cons="Lower event throughput, no native log replay.",
            cost="$600/month",
            feasibility="High",
            risk_assessment="May bottleneck under high ingestion rates.",
            is_selected=False
        )
        alt2 = create_alternative(self.db, self.decision.id, alt2_in, self.user_alice)
        self.assertIsNotNone(alt2.id)
        self.assertEqual(alt2.name, "RabbitMQ")
        self.assertFalse(alt2.is_selected)

        # Retrieve alternatives list
        alternatives = get_alternatives(self.db, self.decision.id, self.user_alice)
        self.assertEqual(len(alternatives), 2)
        self.assertEqual(alternatives[0].name, "Apache Kafka")
        self.assertEqual(alternatives[1].name, "RabbitMQ")

    def test_02_get_single_alternative(self):
        """Test retrieving a specific alternative by ID."""
        alt_in = AlternativeCreateRequest(
            name="AWS SQS",
            description="Fully managed queue service.",
            pros="Zero server management, serverless autoscaling.",
            cons="Message ordering limitations, vendor lock-in.",
            cost="$200/month pay-as-you-go",
            feasibility="Medium",
            risk_assessment="Cold start latency and throughput limits.",
            is_selected=False
        )
        created = create_alternative(self.db, self.decision.id, alt_in, self.user_alice)
        fetched = get_alternative_by_id(self.db, self.decision.id, created.id, self.user_alice)
        self.assertEqual(fetched.id, created.id)
        self.assertEqual(fetched.name, "AWS SQS")
        self.assertEqual(fetched.cost, "$200/month pay-as-you-go")

    def test_03_update_alternative_and_single_selected_behavior(self):
        """Test updating an alternative and unselecting previous selected alternative."""
        alt1_in = AlternativeCreateRequest(
            name="Option A",
            description="Desc A",
            pros="Pros A",
            cons="Cons A",
            cost="$100",
            feasibility="High",
            is_selected=True
        )
        alt1 = create_alternative(self.db, self.decision.id, alt1_in, self.user_alice)

        alt2_in = AlternativeCreateRequest(
            name="Option B",
            description="Desc B",
            pros="Pros B",
            cons="Cons B",
            cost="$200",
            feasibility="Medium",
            is_selected=False
        )
        alt2 = create_alternative(self.db, self.decision.id, alt2_in, self.user_alice)

        self.assertTrue(alt1.is_selected)
        self.assertFalse(alt2.is_selected)

        # Update Option B to be selected
        update_in = AlternativeUpdateRequest(
            is_selected=True,
            cost="$180",
            feasibility="High"
        )
        updated_b = update_alternative(self.db, self.decision.id, alt2.id, update_in, self.user_alice)
        self.assertTrue(updated_b.is_selected)
        self.assertEqual(updated_b.cost, "$180")

        # Refresh Option A and verify it was automatically unselected
        self.db.refresh(alt1)
        self.assertFalse(alt1.is_selected)

    def test_04_delete_alternative(self):
        """Test deleting an alternative."""
        alt_in = AlternativeCreateRequest(
            name="To Delete",
            description="Will be removed",
            pros="None",
            cons="None"
        )
        alt = create_alternative(self.db, self.decision.id, alt_in, self.user_alice)
        self.assertEqual(len(get_alternatives(self.db, self.decision.id, self.user_alice)), 1)

        delete_alternative(self.db, self.decision.id, alt.id, self.user_alice)
        self.assertEqual(len(get_alternatives(self.db, self.decision.id, self.user_alice)), 0)

    def test_05_unauthorized_user_cannot_modify_or_delete(self):
        """Test that another non-admin user cannot modify or delete alternatives."""
        alt_in = AlternativeCreateRequest(
            name="Alice's Alternative",
            description="Owned by Alice",
            pros="P",
            cons="C"
        )
        alt = create_alternative(self.db, self.decision.id, alt_in, self.user_alice)

        # Bob attempts to update
        with self.assertRaises(HTTPException) as cm:
            update_alternative(
                self.db,
                self.decision.id,
                alt.id,
                AlternativeUpdateRequest(name="Bob's Hack"),
                self.user_bob
            )
        self.assertEqual(cm.exception.status_code, 403)

        # Bob attempts to delete
        with self.assertRaises(HTTPException) as cm2:
            delete_alternative(self.db, self.decision.id, alt.id, self.user_bob)
        self.assertEqual(cm2.exception.status_code, 403)

    def test_06_cannot_modify_submitted_decision_alternatives_unless_admin(self):
        """Test that submitting a decision locks alternatives from modification for normal users."""
        alt_in = AlternativeCreateRequest(
            name="Draft Alternative",
            description="Created during draft",
            pros="P",
            cons="C"
        )
        alt = create_alternative(self.db, self.decision.id, alt_in, self.user_alice)

        # Submit decision
        submit_decision(self.db, self.decision.id, self.user_alice)

        # Alice attempts to add new alternative -> blocked with 400
        with self.assertRaises(HTTPException) as cm1:
            create_alternative(
                self.db,
                self.decision.id,
                AlternativeCreateRequest(name="Too Late", description="D", pros="P", cons="C"),
                self.user_alice
            )
        self.assertEqual(cm1.exception.status_code, 400)

        # Alice attempts to update existing alternative -> blocked with 400
        with self.assertRaises(HTTPException) as cm2:
            update_alternative(
                self.db,
                self.decision.id,
                alt.id,
                AlternativeUpdateRequest(name="New Name"),
                self.user_alice
            )
        self.assertEqual(cm2.exception.status_code, 400)

        # Alice attempts to delete alternative -> blocked with 400
        with self.assertRaises(HTTPException) as cm3:
            delete_alternative(self.db, self.decision.id, alt.id, self.user_alice)
        self.assertEqual(cm3.exception.status_code, 400)

        # Admin CAN update alternative even when submitted
        admin_update = update_alternative(
            self.db,
            self.decision.id,
            alt.id,
            AlternativeUpdateRequest(cost="$500"),
            self.user_admin
        )
        self.assertEqual(admin_update.cost, "$500")

    def test_07_cascade_deletion(self):
        """Test that deleting a decision cascades and deletes all child alternatives."""
        alt_in = AlternativeCreateRequest(
            name="Cascade Test",
            description="Should vanish when decision is deleted",
            pros="P",
            cons="C"
        )
        alt = create_alternative(self.db, self.decision.id, alt_in, self.user_alice)
        alt_id = alt.id

        # Delete decision
        self.db.delete(self.decision)
        self.db.commit()

        # Check alternative is deleted from DB
        check_alt = self.db.query(Alternative).filter(Alternative.id == alt_id).first()
        self.assertIsNone(check_alt)


if __name__ == "__main__":
    unittest.main()