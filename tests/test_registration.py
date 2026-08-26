import sys
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base
from app.services.user_service import create_user, seed_roles_if_needed
from app.schemas.user import UserRegisterRequest, UserResponse
from app.core.security import verify_password
from fastapi import HTTPException
from pydantic import ValidationError

print("=== 1. Setting up clean test database in memory ===")
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(test_engine)
TestSession = sessionmaker(bind=test_engine)
db = TestSession()
seed_roles_if_needed(db)

print("\n=== 2. Testing valid registration ===")
req_data = {
    "full_name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPassword123",
    "role": "Employee"
}
user_in = UserRegisterRequest(**req_data)
created_user = create_user(db=db, user_in=user_in)

# Convert to UserResponse
response_dto = UserResponse.model_validate(created_user)
response_dict = response_dto.model_dump()

print("Created User ID:", created_user.id)
print("User Full Name:", created_user.full_name)
print("User Email:", created_user.email)
print("User Role:", created_user.role.name)
print("Hashed Password stored in DB:", created_user.hashed_password)
assert created_user.hashed_password != "TestPassword123", "Password MUST NOT be stored in plaintext"
assert verify_password("TestPassword123", created_user.hashed_password) is True, "Bcrypt verification failed"
assert "hashed_password" not in response_dict, "hashed_password MUST NOT be in UserResponse"
print("-> User response payload serialized safely without hashed_password:")
print(response_dict)

print("\n=== 3. Testing duplicate email rejection ===")
try:
    dup_in = UserRegisterRequest(**req_data)
    create_user(db=db, user_in=dup_in)
    raise AssertionError("Duplicate email was not rejected!")
except HTTPException as e:
    print(f"-> Duplicate email correctly rejected with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 409

print("\n=== 4. Testing invalid role rejection ===")
try:
    invalid_role_data = {
        "full_name": "Invalid Role User",
        "email": "invalidrole@example.com",
        "password": "TestPassword123",
        "role": "SuperHeroRole"
    }
    UserRegisterRequest(**invalid_role_data)
    raise AssertionError("Invalid role was not rejected by validation!")
except ValidationError as e:
    print("-> Invalid role correctly rejected by Pydantic validation:")
    for err in e.errors():
        print(f"   Field: {err.get('loc')}, Error: {err.get('msg')}")

print("\n=== 5. Testing short password rejection ===")
try:
    short_pw_data = {
        "full_name": "Short PW User",
        "email": "shortpw@example.com",
        "password": "short",
        "role": "Employee"
    }
    UserRegisterRequest(**short_pw_data)
    raise AssertionError("Short password was not rejected!")
except ValidationError as e:
    print("-> Short password correctly rejected by Pydantic validation:")
    for err in e.errors():
        print(f"   Field: {err.get('loc')}, Error: {err.get('msg')}")

print("\n=== 6. Testing registration across all 4 roles ===")
for role_name in ["Reviewer", "Manager", "Administrator"]:
    user_req = UserRegisterRequest(
        full_name=f"{role_name} User",
        email=f"{role_name.lower()}@example.com",
        password="StrongPassword123",
        role=role_name
    )
    u = create_user(db=db, user_in=user_req)
    print(f"-> Successfully created user for role: {u.role.name} ({u.email})")

print("\n=======================================================")
print("ALL REGISTRATION VERIFICATION TESTS PASSED SUCCESSFULLY!")
print("=======================================================")