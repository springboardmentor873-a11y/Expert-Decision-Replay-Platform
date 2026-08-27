"""Team management: creation, listing, membership."""
from app.models import RoleEnum
from tests.conftest import make_user, auth_headers


def test_create_team_forbidden_for_employee(client, db_session):
    make_user(db_session, "emp@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    headers = auth_headers(client, "emp@example.com", "CorrectPass123!")
    resp = client.post("/api/teams", json={"name": "Strategy"}, headers=headers)
    assert resp.status_code == 403


def test_create_team_allowed_for_manager(client, db_session):
    make_user(db_session, "mgr@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    headers = auth_headers(client, "mgr@example.com", "CorrectPass123!")
    resp = client.post("/api/teams", json={"name": "Strategy Team", "description": "Core team"}, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Strategy Team"


def test_duplicate_team_name_rejected(client, db_session):
    make_user(db_session, "mgr2@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    headers = auth_headers(client, "mgr2@example.com", "CorrectPass123!")
    client.post("/api/teams", json={"name": "Ops"}, headers=headers)
    resp = client.post("/api/teams", json={"name": "Ops"}, headers=headers)
    assert resp.status_code == 409


def test_list_teams_requires_auth(client):
    resp = client.get("/api/teams")
    assert resp.status_code == 401


def test_list_and_get_team(client, db_session):
    make_user(db_session, "mgr3@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    headers = auth_headers(client, "mgr3@example.com", "CorrectPass123!")
    created = client.post("/api/teams", json={"name": "Finance"}, headers=headers).json()

    listed = client.get("/api/teams", headers=headers)
    assert listed.status_code == 200
    assert any(t["id"] == created["id"] for t in listed.json())

    fetched = client.get(f"/api/teams/{created['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Finance"


def test_get_missing_team_returns_404(client, db_session):
    make_user(db_session, "mgr4@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    headers = auth_headers(client, "mgr4@example.com", "CorrectPass123!")
    resp = client.get("/api/teams/00000000-0000-0000-0000-000000000000", headers=headers)
    assert resp.status_code == 404


def test_add_and_remove_team_member(client, db_session):
    manager = make_user(db_session, "mgr5@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    member = make_user(db_session, "member@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    headers = auth_headers(client, "mgr5@example.com", "CorrectPass123!")

    team = client.post("/api/teams", json={"name": "Design"}, headers=headers).json()

    add = client.post(f"/api/teams/{team['id']}/members", json={"user_id": member.id}, headers=headers)
    assert add.status_code == 200
    assert any(m["id"] == member.id for m in add.json()["members"])

    # Adding the same member twice is handled safely (no duplicate, no error).
    add_again = client.post(f"/api/teams/{team['id']}/members", json={"user_id": member.id}, headers=headers)
    assert add_again.status_code == 200
    assert len(add_again.json()["members"]) == 1

    remove = client.delete(f"/api/teams/{team['id']}/members/{member.id}", headers=headers)
    assert remove.status_code == 200
    assert not any(m["id"] == member.id for m in remove.json()["members"])

    # Removing a member who isn't on the team is handled safely.
    remove_again = client.delete(f"/api/teams/{team['id']}/members/{member.id}", headers=headers)
    assert remove_again.status_code == 200


def test_cannot_add_inactive_user_to_team(client, db_session):
    manager = make_user(db_session, "mgr6@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    inactive = make_user(db_session, "inactive2@example.com", "CorrectPass123!", is_active=False)
    headers = auth_headers(client, "mgr6@example.com", "CorrectPass123!")

    team = client.post("/api/teams", json={"name": "Legal"}, headers=headers).json()
    resp = client.post(f"/api/teams/{team['id']}/members", json={"user_id": inactive.id}, headers=headers)
    assert resp.status_code == 400


def test_team_membership_add_forbidden_for_employee(client, db_session):
    make_user(db_session, "mgr7@example.com", "CorrectPass123!", role=RoleEnum.MANAGER)
    employee = make_user(db_session, "emp2@example.com", "CorrectPass123!", role=RoleEnum.EMPLOYEE)
    mgr_headers = auth_headers(client, "mgr7@example.com", "CorrectPass123!")
    emp_headers = auth_headers(client, "emp2@example.com", "CorrectPass123!")

    team = client.post("/api/teams", json={"name": "Growth"}, headers=mgr_headers).json()
    resp = client.post(f"/api/teams/{team['id']}/members", json={"user_id": employee.id}, headers=emp_headers)
    assert resp.status_code == 403
