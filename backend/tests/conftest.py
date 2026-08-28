import os
from collections.abc import Generator
from datetime import datetime, UTC
from uuid import uuid4

os.environ.setdefault("SECRET_KEY", "test-secret-key-32-characters-min-for-security")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://edrp:edrp@localhost:5432/edrp")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("CORS_ORIGINS", "http://testserver")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app
import app.models
from app.models.collaboration import ApprovalWorkflow, ApprovalStep
from app.models.identity import Role, User, UserProfile
from app.models.taxonomy import DecisionCategory, DecisionTag


test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, class_=Session)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        # Seed system roles
        roles_data = [
            ("employee", "Employee"),
            ("reviewer", "Reviewer"),
            ("manager", "Manager"),
            ("administrator", "Administrator"),
        ]
        for code, name in roles_data:
            r = db.scalar(select(Role).where(Role.code == code))
            if not r:
                db.add(Role(code=code, name=name, description=f"{name} role", is_system=True))
        db.commit()

        # Seed categories
        cats = [
            ("Architecture & Engineering", "architecture-engineering"),
            ("Cloud & Infrastructure", "cloud-infrastructure"),
            ("Security & Compliance", "security-compliance"),
        ]
        for name, slug in cats:
            c = db.scalar(select(DecisionCategory).where(DecisionCategory.slug == slug))
            if not c:
                db.add(DecisionCategory(name=name, slug=slug))
        db.commit()

        # Seed tags
        tags = ["high-impact", "cloud", "security"]
        for tname in tags:
            t = db.scalar(select(DecisionTag).where(DecisionTag.slug == tname))
            if not t:
                db.add(DecisionTag(name=tname, slug=tname))
        db.commit()

        # Seed default workflow
        wf = db.scalar(select(ApprovalWorkflow).where(ApprovalWorkflow.is_default == True))
        if not wf:
            rev_role = db.scalar(select(Role).where(Role.code == "reviewer"))
            mgr_role = db.scalar(select(Role).where(Role.code == "manager"))
            wf = ApprovalWorkflow(name="Default Workflow", is_default=True)
            db.add(wf)
            db.flush()
            db.add(ApprovalStep(workflow_id=wf.id, step_order=1, name="Peer Review", required_role_id=rev_role.id))
            db.add(ApprovalStep(workflow_id=wf.id, step_order=2, name="Manager Sign-off", required_role_id=mgr_role.id))
            db.commit()

    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def create_test_user_helper(db: Session, email: str, role_code: str, full_name: str) -> tuple[User, str, dict[str, str]]:
    u = db.scalar(select(User).where(User.email == email))
    if not u:
        role = db.scalar(select(Role).where(Role.code == role_code))
        u = User(
            email=email,
            hashed_password=hash_password("TestPassword123!"),
            role_id=role.id,
            is_active=True,
        )
        db.add(u)
        db.flush()
        db.add(UserProfile(user_id=u.id, full_name=full_name))
        db.commit()
        db.refresh(u)
    else:
        role = db.scalar(select(Role).where(Role.id == u.role_id))

    token = create_access_token(subject=u.id, extra={"role": role.code, "email": u.email})
    headers = {"Authorization": f"Bearer {token}"}
    return u, token, headers


@pytest.fixture
def employee_user(db_session: Session) -> tuple[User, str, dict[str, str]]:
    return create_test_user_helper(db_session, "test_emp@edrp.org", "employee", "Test Employee")


@pytest.fixture
def reviewer_user(db_session: Session) -> tuple[User, str, dict[str, str]]:
    return create_test_user_helper(db_session, "test_rev@edrp.org", "reviewer", "Test Reviewer")


@pytest.fixture
def manager_user(db_session: Session) -> tuple[User, str, dict[str, str]]:
    return create_test_user_helper(db_session, "test_mgr@edrp.org", "manager", "Test Manager")


@pytest.fixture
def admin_user(db_session: Session) -> tuple[User, str, dict[str, str]]:
    return create_test_user_helper(db_session, "test_admin@edrp.org", "administrator", "Test Admin")
