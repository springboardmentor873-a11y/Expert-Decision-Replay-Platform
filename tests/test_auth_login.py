import sys
import datetime
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.database.database import Base, get_db
from app.services.user_service import create_user, authenticate_user, seed_roles_if_needed
from app.schemas.user import UserRegisterRequest, UserResponse
from app.schemas.auth import LoginRequest, Token
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.api.routes.auth import register_user, login, get_me

print("=== Setting up in-memory test database ===")
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)

def get_test_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

# Seed roles
db = next(get_test_db())
seed_roles_if_needed(db)

# 1. Register test user
print("\n--- 1. Registering Test User ---")
reg_req = UserRegisterRequest(
    full_name="Auth Test User",
    email="authuser@example.com",
    password="ValidPassword123",
    role="Reviewer"
)
reg_res = register_user(user_in=reg_req, db=db)
print(f"Registered user: {reg_res.full_name} ({reg_res.email}) with role: {reg_res.role.name}")

# 2. Successful Login
print("\n--- 2. Testing Successful Login ---")
login_req = LoginRequest(
    email="authuser@example.com",
    password="ValidPassword123"
)
login_res = login(login_in=login_req, db=db)
print(f"Login success! Token type: {login_res.token_type}")
print(f"Access Token: {login_res.access_token[:30]}...")
assert isinstance(login_res, Token)
assert login_res.token_type == "bearer"
assert len(login_res.access_token) > 20
token = login_res.access_token

# 3. Invalid Password Login
print("\n--- 3. Testing Invalid Password Login ---")
try:
    bad_pw_req = LoginRequest(
        email="authuser@example.com",
        password="WrongPassword999"
    )
    login(login_in=bad_pw_req, db=db)
    raise AssertionError("Login with invalid password did NOT raise 401!")
except HTTPException as e:
    print(f"-> Invalid password rejected correctly with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 401

# 4. Invalid Email Login
print("\n--- 4. Testing Invalid Email Login ---")
try:
    bad_email_req = LoginRequest(
        email="nonexistent@example.com",
        password="ValidPassword123"
    )
    login(login_in=bad_email_req, db=db)
    raise AssertionError("Login with invalid email did NOT raise 401!")
except HTTPException as e:
    print(f"-> Invalid email rejected correctly with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 401

# 5. Protected GET /auth/me without Token
print("\n--- 5. Testing Protected GET /auth/me without Token ---")
try:
    get_current_user(credentials=None, db=db)
    raise AssertionError("Protected call without credentials did NOT raise 401!")
except HTTPException as e:
    print(f"-> Missing token correctly rejected with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 401

# 6. Protected GET /auth/me with Valid JWT Token
print("\n--- 6. Testing Protected GET /auth/me with Valid JWT Token ---")
valid_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
me_user = get_current_user(credentials=valid_creds, db=db)
me_response = get_me(current_user=me_user)
me_dto = UserResponse.model_validate(me_response)
me_dict = me_dto.model_dump()

print(f"-> Authenticated profile retrieved: {me_dict['full_name']} ({me_dict['email']})")
print(f"   Role: {me_dict['role']['name']}, Active: {me_dict['is_active']}")
assert me_dict["email"] == "authuser@example.com"
assert me_dict["role"]["name"] == "Reviewer"
assert "hashed_password" not in me_dict, "hashed_password MUST NOT be returned in GET /auth/me"

# 7. Invalid Token rejection
print("\n--- 7. Testing Invalid Token ---")
try:
    invalid_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.payload")
    get_current_user(credentials=invalid_creds, db=db)
    raise AssertionError("Invalid token was NOT rejected!")
except HTTPException as e:
    print(f"-> Malformed token correctly rejected with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 401

# 8. Expired Token rejection
print("\n--- 8. Testing Expired Token ---")
expired_token = create_access_token(
    data={"sub": str(reg_res.id), "email": reg_res.email, "role": reg_res.role.name},
    expires_delta=datetime.timedelta(seconds=-10) # expired 10 seconds ago
)
try:
    expired_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)
    get_current_user(credentials=expired_creds, db=db)
    raise AssertionError("Expired token was NOT rejected!")
except HTTPException as e:
    print(f"-> Expired token correctly rejected with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 401

print("\n=======================================================")
print("ALL AUTHENTICATION & JWT TESTS PASSED SUCCESSFULLY!")
print("=======================================================")