import sys
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from pydantic import ValidationError

from app.database.database import Base
from app.models.role import RoleEnum
from app.services.user_service import (
    create_user,
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
from app.core.dependencies import require_roles
from app.api.routes.users import (
    list_users,
    get_user,
    patch_user_status,
    patch_user_role,
)

print("=== 1. Initializing in-memory SQLite database ===")
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)
db = TestSession()
seed_roles_if_needed(db)

# Create 4 test users (Employee, Reviewer, Manager, Administrator)
emp = create_user(db, UserRegisterRequest(full_name="Alice Employee", email="alice@test.com", password="Password123", role="Employee"))
rev = create_user(db, UserRegisterRequest(full_name="Bob Reviewer", email="bob@test.com", password="Password123", role="Reviewer"))
mgr = create_user(db, UserRegisterRequest(full_name="Charlie Manager", email="charlie@test.com", password="Password123", role="Manager"))
adm = create_user(db, UserRegisterRequest(full_name="Diana Admin", email="diana@test.com", password="Password123", role="Administrator"))

admin_checker = require_roles(RoleEnum.ADMINISTRATOR)

print("\n=== Test 1: Employee tries to access GET /users ===")
try:
    admin_checker(current_user=emp)
    raise AssertionError("Employee was incorrectly allowed access to admin route!")
except HTTPException as e:
    print(f"-> Employee blocked with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

print("\n=== Test 2: Manager tries to access GET /users ===")
try:
    admin_checker(current_user=mgr)
    raise AssertionError("Manager was incorrectly allowed access to admin route!")
except HTTPException as e:
    print(f"-> Manager blocked with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

print("\n=== Test 3: Administrator accesses GET /users ===")
admin_validated = admin_checker(current_user=adm)
users_list = list_users(db=db, current_admin=admin_validated)
print(f"-> Admin retrieved {len(users_list)} users:")
for u in users_list:
    u_dict = UserResponse.model_validate(u).model_dump()
    print(f"   ID: {u.id}, Name: {u.full_name}, Role: {u.role.name}, Active: {u.is_active}")
    assert "hashed_password" not in u_dict
assert len(users_list) == 4

print("\n=== Test 4: Employee accesses their own GET /users/{user_id} ===")
own_profile = get_user(user_id=emp.id, db=db, current_user=emp)
print(f"-> Employee accessed self profile: {own_profile.full_name} ({own_profile.email})")
assert own_profile.id == emp.id
emp_dict = UserResponse.model_validate(own_profile).model_dump()
assert "hashed_password" not in emp_dict

print("\n=== Test 5: Employee tries to access another user's profile ===")
try:
    get_user(user_id=mgr.id, db=db, current_user=emp)
    raise AssertionError("Employee was incorrectly allowed to access another user's profile!")
except HTTPException as e:
    print(f"-> Other user access blocked with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

# Admin accessing another user profile should succeed
admin_accessing_emp = get_user(user_id=emp.id, db=db, current_user=adm)
print(f"-> Admin accessed Employee profile successfully: {admin_accessing_emp.full_name}")
assert admin_accessing_emp.id == emp.id

print("\n=== Test 6: Administrator changes a user's status ===")
status_payload = UserStatusUpdateRequest(is_active=False)
updated_emp = patch_user_status(user_id=emp.id, status_in=status_payload, db=db, current_admin=adm)
print(f"-> Admin deactivated employee: ID {updated_emp.id}, is_active = {updated_emp.is_active}")
assert updated_emp.is_active is False
emp_status_dict = UserResponse.model_validate(updated_emp).model_dump()
assert "hashed_password" not in emp_status_dict

# Reactivate employee
status_payload_reactivate = UserStatusUpdateRequest(is_active=True)
reactivated_emp = patch_user_status(user_id=emp.id, status_in=status_payload_reactivate, db=db, current_admin=adm)
assert reactivated_emp.is_active is True
print(f"-> Admin reactivated employee: is_active = {reactivated_emp.is_active}")

print("\n=== Test 7: Non-administrator tries to change user status ===")
try:
    admin_checker(current_user=emp)
    raise AssertionError("Employee was incorrectly allowed to change user status!")
except HTTPException as e:
    print(f"-> Non-admin blocked from changing status with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

print("\n=== Test 8: Administrator changes a user's role ===")
role_payload = UserRoleUpdateRequest(role=RoleEnum.REVIEWER)
promoted_emp = patch_user_role(user_id=emp.id, role_in=role_payload, db=db, current_admin=adm)
print(f"-> Admin promoted Employee to: {promoted_emp.role.name}")
assert promoted_emp.role.name == "Reviewer"
promoted_dict = UserResponse.model_validate(promoted_emp).model_dump()
assert "hashed_password" not in promoted_dict

print("\n=== Test 9: Invalid role update validation ===")
try:
    UserRoleUpdateRequest(role="InvalidRoleName")
    raise AssertionError("Invalid role name was NOT rejected by validation!")
except ValidationError as e:
    print("-> Invalid role update rejected by Pydantic validation:")
    for err in e.errors():
        print(f"   Field: {err.get('loc')}, Error: {err.get('msg')}")

print("\n=== Test 10: Non-existent user update returns 404 ===")
try:
    patch_user_status(user_id=99999, status_in=UserStatusUpdateRequest(is_active=True), db=db, current_admin=adm)
    raise AssertionError("Non-existent user status update did not return 404!")
except HTTPException as e:
    print(f"-> Missing user returns HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 404

try:
    patch_user_role(user_id=99999, role_in=UserRoleUpdateRequest(role=RoleEnum.MANAGER), db=db, current_admin=adm)
    raise AssertionError("Non-existent user role update did not return 404!")
except HTTPException as e:
    print(f"-> Missing user returns HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 404

print("\n=======================================================")
print("ALL RBAC AND USER MANAGEMENT TESTS PASSED SUCCESSFULLY!")
print("=======================================================")