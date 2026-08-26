import sys
import datetime
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError

from app.database.database import Base
from app.models.role import RoleEnum
from app.models.user import User
from app.services.user_service import (
    create_user,
    authenticate_user,
    seed_roles_if_needed,
    get_all_users,
    get_user_by_id,
    update_user_status,
    update_user_role,
)
from app.schemas.user import (
    UserRegisterRequest,
    UserResponse,
    UserStatusUpdateRequest,
    UserRoleUpdateRequest,
)
from app.schemas.auth import LoginRequest, Token
from app.core.security import create_access_token, verify_password
from app.core.dependencies import get_current_user, require_roles
from app.api.routes.auth import register_user, login, get_me
from app.api.routes.users import (
    list_users,
    get_user,
    patch_user_status,
    patch_user_role,
)

print("=================================================================")
print("  MILESTONE 1 - COMPREHENSIVE END-TO-END VERIFICATION SUITE")
print("=================================================================\n")

# Database Initialization
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)
db = TestSession()
seed_roles_if_needed(db)

# 1. Health Endpoint Verification
from app.main import health_check
health_res = health_check()
print(f"[TEST 1] Backend Health Check: {health_res}")
assert health_res == {"status": "healthy"}

# 2. User Registration Checks
print("\n[TEST 2] User Registration Suite:")

# 2a. Valid Registration
emp_req = UserRegisterRequest(
    full_name="Alice Employee",
    email="alice@company.com",
    password="SecurePassword123",
    role="Employee"
)
emp_user = register_user(user_in=emp_req, db=db)
emp_dto = UserResponse.model_validate(emp_user).model_dump()
print(f"  2a. Valid Registration: Created user '{emp_user.full_name}' with ID {emp_user.id} and Role '{emp_user.role.name}'")
assert emp_user.email == "alice@company.com"
assert emp_user.role.name == "Employee"
assert "hashed_password" not in emp_dto
assert emp_user.hashed_password.startswith("$2b$")

# 2b. Duplicate Email
try:
    register_user(user_in=emp_req, db=db)
    raise AssertionError("Duplicate email registration failed to raise 409!")
except HTTPException as e:
    print(f"  2b. Duplicate Email Check: Correctly rejected with HTTP {e.status_code} ({e.detail})")
    assert e.status_code == 409

# 2c. Invalid Email Format
try:
    UserRegisterRequest(full_name="Bad Email", email="not-valid-email", password="ValidPassword123", role="Employee")
    raise AssertionError("Invalid email format was not rejected by validation!")
except ValidationError:
    print("  2c. Invalid Email Check: Rejected by Pydantic schema validation.")

# 2d. Short Password
try:
    UserRegisterRequest(full_name="Short PW", email="short@company.com", password="short", role="Employee")
    raise AssertionError("Short password was not rejected by validation!")
except ValidationError:
    print("  2d. Short Password Check: Rejected (< 8 characters).")

# 2e. Invalid Role
try:
    UserRegisterRequest(full_name="Bad Role", email="role@company.com", password="ValidPassword123", role="SuperRole")
    raise AssertionError("Invalid role was not rejected by validation!")
except ValidationError:
    print("  2e. Invalid Role Check: Rejected by RoleEnum validation.")

# Create Remaining Roles for Testing
rev_user = register_user(user_in=UserRegisterRequest(full_name="Bob Reviewer", email="bob@company.com", password="SecurePassword123", role="Reviewer"), db=db)
mgr_user = register_user(user_in=UserRegisterRequest(full_name="Charlie Manager", email="charlie@company.com", password="SecurePassword123", role="Manager"), db=db)
adm_user = register_user(user_in=UserRegisterRequest(full_name="Diana Admin", email="admin@company.com", password="SecurePassword123", role="Administrator"), db=db)

# 3. Authentication Checks
print("\n[TEST 3] Authentication & Login Suite:")

# 3a. Valid Login
login_res = login(login_in=LoginRequest(email="alice@company.com", password="SecurePassword123"), db=db)
print(f"  3a. Valid Login: Succeeded with token_type '{login_res.token_type}'")
assert isinstance(login_res, Token)
assert login_res.token_type == "bearer"
alice_token = login_res.access_token

admin_login_res = login(login_in=LoginRequest(email="admin@company.com", password="SecurePassword123"), db=db)
admin_token = admin_login_res.access_token

# 3b. Invalid Password
try:
    login(login_in=LoginRequest(email="alice@company.com", password="WrongPassword999"), db=db)
    raise AssertionError("Invalid password login was not rejected!")
except HTTPException as e:
    print(f"  3b. Invalid Password Check: Correctly rejected with HTTP {e.status_code} ({e.detail})")
    assert e.status_code == 401

# 3c. Invalid Email
try:
    login(login_in=LoginRequest(email="unknown@company.com", password="SecurePassword123"), db=db)
    raise AssertionError("Invalid email login was not rejected!")
except HTTPException as e:
    print(f"  3c. Invalid Email Check: Correctly rejected with HTTP {e.status_code} ({e.detail})")
    assert e.status_code == 401

# 4. Protected Routes & Token Checks
print("\n[TEST 4] Protected Endpoint & Token Validation Suite:")

# 4a. /auth/me without Token
try:
    get_current_user(credentials=None, db=db)
    raise AssertionError("Missing token was not rejected!")
except HTTPException as e:
    print(f"  4a. Missing Token Check: Correctly rejected with HTTP {e.status_code}")
    assert e.status_code == 401

# 4b. /auth/me with Valid Token
alice_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=alice_token)
curr_user = get_current_user(credentials=alice_creds, db=db)
me_res = get_me(current_user=curr_user)
me_dto = UserResponse.model_validate(me_res).model_dump()
print(f"  4b. Valid Token Check: Successfully fetched profile for '{me_dto['full_name']}' ({me_dto['email']})")
assert me_dto["email"] == "alice@company.com"
assert "hashed_password" not in me_dto

# 4c. Malformed Token
try:
    bad_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token.string")
    get_current_user(credentials=bad_creds, db=db)
    raise AssertionError("Malformed token was not rejected!")
except HTTPException as e:
    print(f"  4c. Malformed Token Check: Correctly rejected with HTTP {e.status_code}")
    assert e.status_code == 401

# 4d. Expired Token
expired_jwt = create_access_token(data={"sub": str(emp_user.id), "email": emp_user.email, "role": "Employee"}, expires_delta=datetime.timedelta(seconds=-60))
try:
    exp_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_jwt)
    get_current_user(credentials=exp_creds, db=db)
    raise AssertionError("Expired token was not rejected!")
except HTTPException as e:
    print(f"  4d. Expired Token Check: Correctly rejected with HTTP {e.status_code}")
    assert e.status_code == 401

# 5. Role-Based Access Control Checks
print("\n[TEST 5] Role-Based Access Control (RBAC) Suite:")
admin_required = require_roles(RoleEnum.ADMINISTRATOR)

# 5a. Employee access to Admin route
try:
    admin_required(current_user=emp_user)
    raise AssertionError("Employee was permitted to access Admin route!")
except HTTPException as e:
    print(f"  5a. Employee -> GET /users: Blocked with HTTP {e.status_code} ({e.detail})")
    assert e.status_code == 403

# 5b. Manager access to Admin route
try:
    admin_required(current_user=mgr_user)
    raise AssertionError("Manager was permitted to access Admin route!")
except HTTPException as e:
    print(f"  5b. Manager -> GET /users: Blocked with HTTP {e.status_code} ({e.detail})")
    assert e.status_code == 403

# 5c. Administrator access to Admin route
admin_validated = admin_required(current_user=adm_user)
all_users = list_users(db=db, current_admin=admin_validated)
print(f"  5c. Administrator -> GET /users: Succeeded with {len(all_users)} user records returned.")
assert len(all_users) == 4

# 5d. User accessing own profile
own_profile = get_user(user_id=emp_user.id, db=db, current_user=emp_user)
print(f"  5d. Employee accessing own profile (ID {emp_user.id}): Succeeded ({own_profile.full_name})")
assert own_profile.id == emp_user.id

# 5e. User accessing other user's profile
try:
    get_user(user_id=mgr_user.id, db=db, current_user=emp_user)
    raise AssertionError("Employee was permitted to access Manager profile!")
except HTTPException as e:
    print(f"  5e. Employee -> GET /users/{mgr_user.id}: Blocked with HTTP {e.status_code} ({e.detail})")
    assert e.status_code == 403

# Admin accessing any user profile
admin_access_mgr = get_user(user_id=mgr_user.id, db=db, current_user=adm_user)
print(f"  5f. Administrator -> GET /users/{mgr_user.id}: Succeeded ({admin_access_mgr.full_name})")
assert admin_access_mgr.id == mgr_user.id

# 6. User Management Suite
print("\n[TEST 6] User Management Suite:")

# 6a. Admin updating user status
deactivated_emp = patch_user_status(user_id=emp_user.id, status_in=UserStatusUpdateRequest(is_active=False), db=db, current_admin=adm_user)
print(f"  6a. Admin status change: Deactivated user ID {deactivated_emp.id}, is_active = {deactivated_emp.is_active}")
assert deactivated_emp.is_active is False

# Reactivate
reactivated_emp = patch_user_status(user_id=emp_user.id, status_in=UserStatusUpdateRequest(is_active=True), db=db, current_admin=adm_user)
assert reactivated_emp.is_active is True

# 6b. Non-admin trying to update status
try:
    admin_required(current_user=emp_user)
    raise AssertionError("Non-admin was permitted to update user status!")
except HTTPException as e:
    print(f"  6b. Non-admin status change attempt: Blocked with HTTP {e.status_code}")
    assert e.status_code == 403

# 6c. Admin updating user role
promoted_emp = patch_user_role(user_id=emp_user.id, role_in=UserRoleUpdateRequest(role=RoleEnum.REVIEWER), db=db, current_admin=adm_user)
print(f"  6c. Admin role update: Promoted user ID {promoted_emp.id} to role '{promoted_emp.role.name}'")
assert promoted_emp.role.name == "Reviewer"

# 6d. Invalid role update
try:
    UserRoleUpdateRequest(role="NonExistentRole")
    raise AssertionError("Invalid role was not rejected by validation!")
except ValidationError:
    print("  6d. Invalid role update attempt: Rejected by Pydantic validation.")

# 7. Security & Sanitization Verification
print("\n[TEST 7] Security & Hash Sanitization Verification:")
for user_obj in all_users:
    dto = UserResponse.model_validate(user_obj).model_dump()
    assert "hashed_password" not in dto, "Security violation: hashed_password leaked in response DTO!"
    assert verify_password("SecurePassword123", user_obj.hashed_password), "Bcrypt password verification failed!"
print("  7a. Verified 100% of user response payloads omit hashed_password.")
print("  7b. Verified all stored password hashes use valid bcrypt encryption.")

print("\n=================================================================")
print("  ALL MILESTONE 1 END-TO-END VERIFICATION CHECKS PASSED (100%)")
print("=================================================================")