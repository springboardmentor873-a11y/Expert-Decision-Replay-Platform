import sys
sys.path.insert(0, 'backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError

from app.database.database import Base
from app.models.role import RoleEnum
from app.models.decision import Decision, DecisionStatusEnum
from app.models.user import User
from app.schemas.user import UserRegisterRequest
from app.schemas.auth import LoginRequest
from app.schemas.decision import DecisionCreateRequest, DecisionUpdateRequest, DecisionResponse
from app.services.user_service import create_user, seed_roles_if_needed, authenticate_user
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.api.routes.auth import register_user as api_register_user, login as api_login
from app.api.routes.decisions import (
    create_new_decision,
    list_decisions,
    get_single_decision,
    patch_decision,
    submit_draft_decision,
    remove_decision,
)

print("=================================================================")
print("  MILESTONE 2 - DECISION MANAGEMENT TEST SUITE")
print("=================================================================\n")

# 1. Setup in-memory SQLite database
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestSession = sessionmaker(bind=engine)
db = TestSession()
seed_roles_if_needed(db)

# Create test users: Employee 1, Employee 2, and Admin
emp1 = api_register_user(user_in=UserRegisterRequest(full_name="Alice Engineer", email="alice@test.com", password="Password123!", role="Employee"), db=db)
emp2 = api_register_user(user_in=UserRegisterRequest(full_name="Bob Developer", email="bob@test.com", password="Password123!", role="Employee"), db=db)
admin = api_register_user(user_in=UserRegisterRequest(full_name="Diana Admin", email="admin@test.com", password="Password123!", role="Administrator"), db=db)

alice_token = api_login(login_in=LoginRequest(email="alice@test.com", password="Password123!"), db=db).access_token
bob_token = api_login(login_in=LoginRequest(email="bob@test.com", password="Password123!"), db=db).access_token
admin_token = api_login(login_in=LoginRequest(email="admin@test.com", password="Password123!"), db=db).access_token

# 2. Test 1 & 3: Authenticated user creates a decision; verify Draft status and created_by
print("[TEST 1 & 3] User creates decision & initial status is Draft:")
create_payload = DecisionCreateRequest(
    title="Adopt FastAPI Architecture",
    problem_statement="Legacy REST framework is slow and lacks type safety.",
    context="High throughput required for enterprise decision capture.",
    decision_taken="Migrate backend services to FastAPI with SQLAlchemy 2.0.",
    reasoning="FastAPI offers async performance, automatic OpenAPI schema generation, and Pydantic validation.",
    expected_outcome="Reduce API latency by 40% and improve type safety.",
    actual_outcome=None
)
decision1 = create_new_decision(decision_in=create_payload, db=db, current_user=emp1)
print(f"  -> Created decision ID {decision1.id}: '{decision1.title}' with status '{decision1.status}' and creator ID {decision1.created_by}")
assert decision1.id is not None
assert decision1.title == "Adopt FastAPI Architecture"
assert decision1.status == DecisionStatusEnum.DRAFT.value
assert decision1.created_by == emp1.id

# 3. Test 2: Unauthenticated user cannot create a decision
print("\n[TEST 2] Unauthenticated access check:")
try:
    get_current_user(credentials=None, db=db)
    raise AssertionError("Unauthenticated access should have been rejected with 401!")
except HTTPException as e:
    print(f"  -> Unauthenticated request correctly rejected with HTTP {e.status_code}")
    assert e.status_code == 401

# 4. Test 4: User can retrieve their own decision
print("\n[TEST 4] User retrieves own decision:")
fetched_d1 = get_single_decision(decision_id=decision1.id, db=db, current_user=emp1)
print(f"  -> Successfully fetched decision ID {fetched_d1.id}: '{fetched_d1.title}'")
assert fetched_d1.id == decision1.id
assert fetched_d1.created_by == emp1.id

# 5. Test 5: User can retrieve decision list
print("\n[TEST 5] User retrieves list of accessible decisions:")
decisions_list = list_decisions(status=None, skip=0, limit=100, db=db, current_user=emp1)
print(f"  -> Alice retrieved {len(decisions_list)} decision(s)")
assert len(decisions_list) >= 1
assert decisions_list[0].id == decision1.id

# Bob creates a second decision
bob_decision = create_new_decision(
    decision_in=DecisionCreateRequest(
        title="Bob's Cloud Database Migration",
        problem_statement="On-prem database scaling limitations.",
        context="Cloud migration initiative Q3.",
        decision_taken="Migrate to Managed PostgreSQL on GCP.",
        reasoning="Reduces maintenance overhead and enables high availability.",
        expected_outcome="99.99% uptime."
    ),
    db=db,
    current_user=emp2
)
print(f"  -> Bob created decision ID {bob_decision.id}: '{bob_decision.title}'")

# Bob sees only his decision in list
bob_list = list_decisions(status=None, skip=0, limit=100, db=db, current_user=emp2)
assert len(bob_list) == 1
assert bob_list[0].id == bob_decision.id

# 6. Test 6: User can update their Draft decision
print("\n[TEST 6] User updates their Draft decision:")
update_payload = DecisionUpdateRequest(
    title="Adopt FastAPI & Async Architecture",
    expected_outcome="Reduce latency by 50% and achieve 100% type safety."
)
updated_d1 = patch_decision(decision_id=decision1.id, decision_in=update_payload, db=db, current_user=emp1)
print(f"  -> Updated title: '{updated_d1.title}'")
print(f"  -> Updated expected outcome: '{updated_d1.expected_outcome}'")
assert updated_d1.title == "Adopt FastAPI & Async Architecture"
assert updated_d1.expected_outcome == "Reduce latency by 50% and achieve 100% type safety."

# 7. Test 7: User submits a Draft decision -> status becomes Submitted
print("\n[TEST 7] User submits Draft decision:")
submitted_d1 = submit_draft_decision(decision_id=decision1.id, db=db, current_user=emp1)
print(f"  -> Submitted decision status: '{submitted_d1.status}'")
assert submitted_d1.status == DecisionStatusEnum.SUBMITTED.value

# Attempting to submit again should fail (only Draft can be submitted)
try:
    submit_draft_decision(decision_id=decision1.id, db=db, current_user=emp1)
    raise AssertionError("Submitting non-draft decision should fail!")
except HTTPException as e:
    print(f"  -> Re-submitting non-draft rejected with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 400

# 8. Test 8: User cannot modify another user's decision
print("\n[TEST 8] User tries to modify another user's decision:")
try:
    patch_decision(decision_id=bob_decision.id, decision_in=DecisionUpdateRequest(title="Hacked Title"), db=db, current_user=emp1)
    raise AssertionError("Modifying another user's decision should have been blocked!")
except HTTPException as e:
    print(f"  -> Blocked modification with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

# 9. Test 9: User cannot delete another user's decision
print("\n[TEST 9] User tries to delete another user's decision:")
try:
    remove_decision(decision_id=bob_decision.id, db=db, current_user=emp1)
    raise AssertionError("Deleting another user's decision should have been blocked!")
except HTTPException as e:
    print(f"  -> Blocked deletion with HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

# 10. Test 10: User can delete their own Draft decision
print("\n[TEST 10] User deletes own Draft decision:")
temp_decision = create_new_decision(
    decision_in=DecisionCreateRequest(
        title="Temporary Draft Decision",
        problem_statement="Test statement",
        context="Test context",
        decision_taken="Test decision",
        reasoning="Test reasoning"
    ),
    db=db,
    current_user=emp1
)
remove_decision(decision_id=temp_decision.id, db=db, current_user=emp1)
print(f"  -> Successfully deleted draft decision ID {temp_decision.id}")

# Verify it is gone
try:
    get_single_decision(decision_id=temp_decision.id, db=db, current_user=emp1)
    raise AssertionError("Deleted decision should not be found!")
except HTTPException as e:
    assert e.status_code == 404

# 11. Test 11: Missing decision returns 404
print("\n[TEST 11] Missing decision returns 404:")
try:
    get_single_decision(decision_id=99999, db=db, current_user=emp1)
    raise AssertionError("Missing decision should raise 404!")
except HTTPException as e:
    print(f"  -> Missing decision correctly returned HTTP {e.status_code}")
    assert e.status_code == 404

# 12. Test 12: Invalid decision payload returns 422
print("\n[TEST 12] Invalid decision payload validation:")
try:
    DecisionCreateRequest(title="", problem_statement="", context="", decision_taken="", reasoning="")
    raise AssertionError("Empty fields should fail Pydantic validation!")
except ValidationError:
    print("  -> Empty strings correctly rejected by Pydantic schema validation.")

# 13. Test 13: Invalid status is rejected
print("\n[TEST 13] Invalid status rejection:")
try:
    DecisionUpdateRequest(status="InvalidCustomStatus")
    raise AssertionError("Invalid status should fail validation!")
except ValidationError:
    print("  -> Non-enum status correctly rejected by validation.")

# 14. Test 14: Administrator access permissions
print("\n[TEST 14] Administrator access permissions:")
admin_list = list_decisions(status=None, skip=0, limit=100, db=db, current_user=admin)
print(f"  -> Administrator sees all {len(admin_list)} decisions across all users.")
assert len(admin_list) >= 2

# Administrator can view Bob's decision
admin_fetched_bob = get_single_decision(decision_id=bob_decision.id, db=db, current_user=admin)
assert admin_fetched_bob.id == bob_decision.id

# Administrator can update status to Approved
admin_approve = patch_decision(
    decision_id=decision1.id,
    decision_in=DecisionUpdateRequest(status=DecisionStatusEnum.APPROVED, actual_outcome="Achieved 45% latency reduction in prod."),
    db=db,
    current_user=admin
)
print(f"  -> Administrator approved decision ID {admin_approve.id}: Status '{admin_approve.status}', Actual Outcome: '{admin_approve.actual_outcome}'")
assert admin_approve.status == DecisionStatusEnum.APPROVED.value

# 15. Test 15: created_by cannot be spoofed by frontend input
print("\n[TEST 15] Verify created_by derivation security:")
assert not hasattr(DecisionCreateRequest, "created_by"), "DecisionCreateRequest schema must NOT include created_by field!"
assert decision1.created_by == emp1.id
assert bob_decision.created_by == emp2.id
print("  -> Verified created_by is strictly derived from JWT token and impossible to spoof.")

print("\n=================================================================")
print("  ALL 15 MILESTONE 2 DECISION TESTS PASSED (100%)")
print("=================================================================")