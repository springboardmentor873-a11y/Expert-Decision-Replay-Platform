import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_suite.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.database import get_db
import app.models  # noqa: F401 - register all models on Base.metadata
from app.main import app
from app.core.security import hash_password
from app.models.user import User

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_suite.db")
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    # Fresh schema for every single test = full isolation, no cross-test
    # unique-constraint collisions (e.g. reusing the same seed email).
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db_file():
    yield
    engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture()
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    return TestClient(app)


def make_user(db, **overrides):
    defaults = dict(
        full_name="Test User",
        email="user@example.com",
        password=hash_password("Password123"),
        role="Employee",
        employee_id="T0001",
        department="IT",
        designation="Engineer",
        phone_number="1112223333",
    )
    defaults.update(overrides)
    user = User(**defaults)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def employee(db_session):
    return make_user(
        db_session,
        email="employee@example.com",
        employee_id="EMP100",
        role="Employee",
    )


@pytest.fixture()
def other_employee(db_session):
    return make_user(
        db_session,
        email="other-employee@example.com",
        employee_id="EMP101",
        role="Employee",
        department="CAC",
    )


@pytest.fixture()
def manager(db_session):
    return make_user(
        db_session,
        email="manager@example.com",
        employee_id="MGR100",
        role="Manager",
        department="IT",
    )


@pytest.fixture()
def reviewer(db_session):
    return make_user(
        db_session,
        email="reviewer@example.com",
        employee_id="REV100",
        role="Reviewer",
    )


@pytest.fixture()
def administrator(db_session):
    return make_user(
        db_session,
        email="admin@example.com",
        employee_id="ADM100",
        role="Administrator",
    )


def login(client, email, password="Password123"):
    r = client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
