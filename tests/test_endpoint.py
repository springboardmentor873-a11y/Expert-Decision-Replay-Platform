import sys
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.services.user_service import seed_roles_if_needed
from app.main import app
from app.schemas.user import UserRegisterRequest

# Set up clean SQLite DB
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)

def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Seed roles
with TestSession() as db:
    seed_roles_if_needed(db)

# Directly test the endpoint function logic
from app.api.routes.auth import register_user

db = next(override_get_db())
req = UserRegisterRequest(
    full_name="Endpoint Test User",
    email="endpoint@example.com",
    password="SecurePassword123",
    role="Manager"
)

result = register_user(user_in=req, db=db)
print("Endpoint call result:")
print(f"  ID: {result.id}")
print(f"  Name: {result.full_name}")
print(f"  Email: {result.email}")
print(f"  Role: {result.role.name}")
print(f"  Active: {result.is_active}")
assert result.email == "endpoint@example.com"
assert result.role.name == "Manager"
print("Endpoint direct invocation PASSED!")