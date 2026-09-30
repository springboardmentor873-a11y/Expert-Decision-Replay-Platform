import pytest
from sqlalchemy import update

from app.models.user import User, UserRole

pytestmark = pytest.mark.asyncio


async def _register_and_login(client, email="member@example.com", name="Member"):
    await client.post(
        "/api/v1/auth/register",
        json={"full_name": name, "email": email, "password": "password123"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    tokens = resp.json()
    me = await client.get("/api/v1/auth/me", headers=_headers(tokens))
    tokens["id"] = me.json()["id"]
    return tokens


def _headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _promote(client, db_session, email, role):
    name = email.split("@")[0].title()
    await client.post(
        "/api/v1/auth/register",
        json={"full_name": name, "email": email, "password": "password123"},
    )
    await db_session.execute(update(User).where(User.email == email).values(role=role))
    await db_session.commit()
    tokens = (await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "password123"}
    )).json()
    me = await client.get("/api/v1/auth/me", headers=_headers(tokens))
    tokens["id"] = me.json()["id"]
    return tokens


async def _create_team(client, tokens, name="Platform"):
    resp = await client.post(
        "/api/v1/teams", json={"name": name, "description": "Test team"},
        headers=_headers(tokens),
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_create_join_request(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin)
    member = await _register_and_login(client, email="ada@example.com", name="Ada")

    resp = await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "pending"
    assert body["team_id"] == team_id
    assert body["user_id"] == member["id"]

    # A pending request must NOT have assigned membership yet.
    me = await client.get("/api/v1/auth/me", headers=_headers(member))
    assert me.json()["team_id"] is None


async def test_join_request_requires_auth(client):
    resp = await client.post(
        "/api/v1/teams/00000000-0000-0000-0000-000000000000/join"
    )
    assert resp.status_code == 401


async def test_join_request_invalid_team_returns_404(client, db_session):
    await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    resp = await client.post(
        "/api/v1/teams/00000000-0000-0000-0000-000000000000/join", headers=_headers(member)
    )
    assert resp.status_code == 404


async def test_user_with_team_cannot_request_join(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_a = await _create_team(client, admin, "Team A")
    team_b = await _create_team(client, admin, "Team B")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_a},
        headers=_headers(admin),
    )

    resp = await client.post(
        f"/api/v1/teams/{team_b}/join", headers=_headers(member)
    )
    assert resp.status_code == 409


async def test_duplicate_pending_request_prevented(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin)
    member = await _register_and_login(client, email="ada@example.com", name="Ada")

    first = await client.post(f"/api/v1/teams/{team_id}/join", headers=_headers(member))
    assert first.status_code == 201

    second = await client.post(f"/api/v1/teams/{team_id}/join", headers=_headers(member))
    assert second.status_code == 409

    mine = await client.get("/api/v1/teams/my-join-requests", headers=_headers(member))
    assert len(mine.json()) == 1


async def test_my_join_requests_returns_own_requests(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_a = await _create_team(client, admin, "Team A")
    team_b = await _create_team(client, admin, "Team B")
    member = await _register_and_login(client, email="ada@example.com", name="Ada")

    await client.post(f"/api/v1/teams/{team_a}/join", headers=_headers(member))
    await client.post(f"/api/v1/teams/{team_b}/join", headers=_headers(member))

    resp = await client.get("/api/v1/teams/my-join-requests", headers=_headers(member))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert all(item["status"] == "pending" for item in data)
    assert {item["team_id"] for item in data} == {team_a, team_b}


async def test_employee_cannot_view_all_join_requests(client, db_session):
    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    resp = await client.get("/api/v1/teams/join-requests", headers=_headers(member))
    assert resp.status_code == 403


async def test_join_requests_list_requires_auth(client):
    resp = await client.get("/api/v1/teams/join-requests")
    assert resp.status_code == 401


async def test_manager_can_view_pending_requests(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    manager = await _promote(client, db_session, "manager@example.com", UserRole.MANAGER)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada Lovelace")
    await client.post(f"/api/v1/teams/{team_id}/join", headers=_headers(member))

    resp = await client.get("/api/v1/teams/join-requests", headers=_headers(manager))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["requester_name"] == "Ada Lovelace"
    assert data[0]["team_name"] == "Platform"
    assert data[0]["status"] == "pending"


async def test_approve_request_assigns_membership(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )).json()["id"]

    resp = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/approve", headers=_headers(admin)
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"

    # Approval is what creates membership.
    me = await client.get("/api/v1/auth/me", headers=_headers(member))
    assert me.json()["team_id"] == team_id


async def test_approve_request_requires_manager(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    emp = await _register_and_login(client, email="emp@example.com", name="Emp")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(emp)
    )).json()["id"]

    other_emp = await _register_and_login(client, email="other@example.com", name="Other")
    resp = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/approve", headers=_headers(other_emp)
    )
    assert resp.status_code == 403


async def test_reject_request_leaves_membership_unchanged(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )).json()["id"]

    resp = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/reject", headers=_headers(admin)
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"

    me = await client.get("/api/v1/auth/me", headers=_headers(member))
    assert me.json()["team_id"] is None


async def test_already_processed_request_cannot_be_processed_again(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )).json()["id"]

    approve = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/approve", headers=_headers(admin)
    )
    assert approve.status_code == 200

    again = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/reject", headers=_headers(admin)
    )
    assert again.status_code == 409


async def test_rejected_request_cannot_be_approved_later(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )).json()["id"]

    await client.post(
        f"/api/v1/teams/join-requests/{request_id}/reject", headers=_headers(admin)
    )
    resp = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/approve", headers=_headers(admin)
    )
    assert resp.status_code == 409


async def test_approval_blocked_if_user_got_assigned_elsewhere(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_a = await _create_team(client, admin, "Team A")
    team_b = await _create_team(client, admin, "Team B")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_a}/join", headers=_headers(member)
    )).json()["id"]

    # The manager assigns the user to Team B while a Team A request is pending.
    await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_b},
        headers=_headers(admin),
    )

    resp = await client.post(
        f"/api/v1/teams/join-requests/{request_id}/approve", headers=_headers(admin)
    )
    assert resp.status_code == 409

    me = await client.get("/api/v1/auth/me", headers=_headers(member))
    assert me.json()["team_id"] == team_b  # not silently moved


async def test_request_creates_notification_for_managers(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    manager = await _promote(client, db_session, "manager@example.com", UserRole.MANAGER)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    await client.post(f"/api/v1/teams/{team_id}/join", headers=_headers(member))

    resp = await client.get("/api/v1/notifications", headers=_headers(manager))
    data = resp.json()
    assert data["total"] == 1
    assert data["notifications"][0]["notification_type"] == "team_join_requested"


async def test_approval_creates_notification_for_requester(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )).json()["id"]

    await client.post(
        f"/api/v1/teams/join-requests/{request_id}/approve", headers=_headers(admin)
    )

    resp = await client.get("/api/v1/notifications", headers=_headers(member))
    notices = resp.json()["notifications"]
    assert any(n["notification_type"] == "team_join_approved" for n in notices)


async def test_rejection_creates_notification_for_requester(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_id = await _create_team(client, admin, "Platform")

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    request_id = (await client.post(
        f"/api/v1/teams/{team_id}/join", headers=_headers(member)
    )).json()["id"]

    await client.post(
        f"/api/v1/teams/join-requests/{request_id}/reject", headers=_headers(admin)
    )

    resp = await client.get("/api/v1/notifications", headers=_headers(member))
    notices = resp.json()["notifications"]
    assert any(n["notification_type"] == "team_join_rejected" for n in notices)