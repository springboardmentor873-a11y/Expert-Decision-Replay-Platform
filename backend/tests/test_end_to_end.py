"""
Full end-to-end walkthrough matching the Milestone 1 acceptance scenario:

  1. Migrations/schema ready (via the shared in-memory engine)
  2. Register Employee
  3. Duplicate registration rejected
  4. Register second user
  5. Login
  6. Retrieve current profile
  7. Attempt administrator endpoint -> 403
  8. Seed/verify Administrator, promote user to Administrator
  9. Login again as the promoted admin
  10. Administrator lists users
  11. Create Team
  12. Add Employee to Team
  13. Verify membership
  14. Remove member
  15. Deactivate a user
  16. Verify inactive user cannot login
  17. Verify audit events were recorded for the above

Run with:  pytest tests/test_end_to_end.py -v -s
Uses the shared isolated in-memory SQLite database from conftest.py — never
touches the real Postgres instance.
"""
from app.models import RoleEnum
from tests.conftest import make_user


def test_full_milestone_1_journey(client, db_session):
    # 1. Health check confirms the app is up.
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    print("\n[1] Health check OK:", health.json())

    # 2. Register an Employee.
    reg_payload = {
        "full_name": "Priya Employee",
        "email": "priya@decisionreplay.example.com",
        "password": "EmployeePass123!",
        "job_title": "Business Analyst",
        "department": "Operations",
    }
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201
    assert resp.json()["role"] == "employee"
    print("[2] Registered employee, defaulted to role:", resp.json()["role"])

    # 3. Duplicate registration is rejected.
    dup = client.post("/api/auth/register", json=reg_payload)
    assert dup.status_code == 409
    print("[3] Duplicate registration correctly rejected (409)")

    # 4. Register a second user.
    resp2 = client.post("/api/auth/register", json={
        "full_name": "Sam Second", "email": "sam@decisionreplay.example.com", "password": "SecondPass123!",
    })
    assert resp2.status_code == 201
    sam_id = resp2.json()["id"]
    print("[4] Registered second user:", resp2.json()["email"])

    # 5. Login as the employee.
    login = client.post("/api/auth/login", json={
        "email": "priya@decisionreplay.example.com", "password": "EmployeePass123!",
    })
    assert login.status_code == 200
    tokens = login.json()
    employee_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    print("[5] Login succeeded, tokens issued")

    # 6. Retrieve current profile.
    me = client.get("/api/users/me", headers=employee_headers)
    assert me.status_code == 200
    assert me.json()["email"] == "priya@decisionreplay.example.com"
    employee_id = me.json()["id"]
    print("[6] /users/me returned correct profile")

    # 7. Attempt an administrator-only endpoint -> 403.
    forbidden = client.get("/api/users", headers=employee_headers)
    assert forbidden.status_code == 403
    print("[7] Employee correctly blocked from /users listing (403)")

    # 8. Seed an Administrator and promote the employee to Administrator.
    make_user(db_session, "admin@decisionreplay.example.com", "AdminPass123!", role=RoleEnum.ADMINISTRATOR)
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@decisionreplay.example.com", "password": "AdminPass123!",
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    promote = client.patch(f"/api/users/{employee_id}/role", json={"role": "administrator"}, headers=admin_headers)
    assert promote.status_code == 200
    assert promote.json()["role"] == "administrator"
    print("[8] Promoted Priya from employee -> administrator")

    # 9. Login again as the now-promoted administrator.
    relogin = client.post("/api/auth/login", json={
        "email": "priya@decisionreplay.example.com", "password": "EmployeePass123!",
    })
    assert relogin.status_code == 200
    priya_admin_headers = {"Authorization": f"Bearer {relogin.json()['access_token']}"}
    print("[9] Re-login as promoted administrator succeeded")

    # 10. Administrator lists users.
    listed = client.get("/api/users", headers=priya_admin_headers)
    assert listed.status_code == 200
    assert len(listed.json()) >= 3  # priya, sam, seeded admin
    print("[10] Administrator listed all users")

    # 11. Create a team.
    team_resp = client.post("/api/teams", json={
        "name": "Strategy Team", "description": "Core decision review team",
    }, headers=priya_admin_headers)
    assert team_resp.status_code == 201
    team_id = team_resp.json()["id"]
    print("[11] Created team:", team_resp.json()["name"])

    # 12. Add the second user to the team.
    add_member = client.post(f"/api/teams/{team_id}/members", json={"user_id": sam_id}, headers=priya_admin_headers)
    assert add_member.status_code == 200
    print("[12] Added Sam to Strategy Team")

    # 13. Verify membership.
    team_detail = client.get(f"/api/teams/{team_id}", headers=priya_admin_headers)
    assert any(m["id"] == sam_id for m in team_detail.json()["members"])
    print("[13] Verified team membership")

    # 14. Remove the member.
    remove_member = client.delete(f"/api/teams/{team_id}/members/{sam_id}", headers=priya_admin_headers)
    assert remove_member.status_code == 200
    assert not any(m["id"] == sam_id for m in remove_member.json()["members"])
    print("[14] Removed Sam from Strategy Team")

    # 15. Deactivate the second user.
    deactivate = client.patch(f"/api/users/{sam_id}/deactivate", headers=priya_admin_headers)
    assert deactivate.status_code == 200
    assert deactivate.json()["is_active"] is False
    print("[15] Deactivated Sam's account")

    # 16. Verify the deactivated user cannot log in.
    blocked_login = client.post("/api/auth/login", json={
        "email": "sam@decisionreplay.example.com", "password": "SecondPass123!",
    })
    assert blocked_login.status_code == 403
    print("[16] Deactivated user correctly blocked from login (403)")

    # 17. Verify audit events were recorded for the journey above.
    audit = client.get("/api/audit", headers=priya_admin_headers)
    assert audit.status_code == 200
    actions = {row["action"] for row in audit.json()}
    for expected in ("user_registered", "login", "role_changed", "team_created",
                     "team_member_added", "team_member_removed", "user_deactivated"):
        assert expected in actions, f"missing audit action: {expected}"
    print("[17] Verified audit events:", sorted(actions))

    print("\nAll Milestone 1 acceptance-criteria steps verified end-to-end.")
