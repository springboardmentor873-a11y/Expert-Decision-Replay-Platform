import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, Team, Role
from app.auth import get_password_hash, create_access_token

# In-memory SQLite for fast, completely isolated integration testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Provides a transactional database session rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_users(db_session):
    """Seed test users across various roles."""
    team = Team(name="Test Engineering Core", description="Integration Test Team")
    db_session.add(team)
    db_session.commit()

    admin = User(
        email="test_admin@expert.com",
        full_name="Admin Test User",
        hashed_password=get_password_hash("Secret123!"),
        role=Role.ADMINISTRATOR,
        team_id=team.id,
        is_active=True
    )
    manager = User(
        email="test_manager@expert.com",
        full_name="Manager Test User",
        hashed_password=get_password_hash("Secret123!"),
        role=Role.MANAGER,
        team_id=team.id,
        is_active=True
    )
    reviewer = User(
        email="test_reviewer@expert.com",
        full_name="Reviewer Test User",
        hashed_password=get_password_hash("Secret123!"),
        role=Role.REVIEWER,
        team_id=team.id,
        is_active=True
    )
    employee = User(
        email="test_employee@expert.com",
        full_name="Employee Test User",
        hashed_password=get_password_hash("Secret123!"),
        role=Role.EMPLOYEE,
        team_id=team.id,
        is_active=True
    )

    db_session.add_all([admin, manager, reviewer, employee])
    db_session.commit()
    for u in [admin, manager, reviewer, employee]:
        db_session.refresh(u)

    return {
        "admin": admin,
        "manager": manager,
        "reviewer": reviewer,
        "employee": employee,
    }

@pytest.fixture
def auth_headers(test_users):
    """Helper returning authorization headers for each role."""
    tokens = {}
    for role_name, user in test_users.items():
        token = create_access_token({"sub": user.email, "role": user.role.value, "user_id": user.id})
        tokens[role_name] = {"Authorization": f"Bearer {token}"}
    return tokens
