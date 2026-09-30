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
    await _register_and_login(client, email=email, name=email.split("@")[0])
    await db_session.execute(update(User).where(User.email == email).values(role=role))
    await db_session.commit()
    tokens = (await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "password123"}
    )).json()
    return tokens


async def _create_team(client, tokens, name="Platform", description="Core platform team"):
    return await client.post(
        "/api/v1/teams",
        json={"name": name, "description": description},
        headers=_headers(tokens),
    )


async def test_list_teams_requires_auth(client):
    resp = await client.get("/api/v1/teams")
    assert resp.status_code == 401


async def test_list_teams_returns_all_teams(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    await _create_team(client, admin, "Alpha")
    await _create_team(client, admin, "Beta")

    employee = await _register_and_login(client, email="worker@example.com", name="Worker")
    resp = await client.get("/api/v1/teams", headers=_headers(employee))
    assert resp.status_code == 200
    body = resp.json()
    assert [t["name"] for t in body] == ["Alpha", "Beta"]
    assert all(t["member_count"] == 0 and t["decision_count"] == 0 for t in body)


async def test_get_team_details_includes_members_and_decisions(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_resp = await _create_team(client, admin)
    team_id = team_resp.json()["id"]

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_id},
        headers=_headers(admin),
    )
    member_tokens = (await client.post(
        "/api/v1/auth/login", json={"email": "ada@example.com", "password": "password123"}
    )).json()
    await client.post(
        "/api/v1/decisions",
        json={"title": "Choose CI", "problem_statement": "Builds are slow."},
        headers=_headers(member_tokens),
    )

    resp = await client.get(f"/api/v1/teams/{team_id}", headers=_headers(member_tokens))
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Platform"
    assert body["member_count"] == 1
    assert body["decision_count"] == 1
    assert body["members"][0]["full_name"] == "Ada"
    assert body["members"][0]["role"] == "employee"
    assert body["decisions"][0]["title"] == "Choose CI"


async def test_get_current_users_team(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_resp = await _create_team(client, admin)
    team_id = team_resp.json()["id"]

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_id},
        headers=_headers(admin),
    )

    member_tokens = (await client.post(
        "/api/v1/auth/login", json={"email": "ada@example.com", "password": "password123"}
    )).json()
    resp = await client.get("/api/v1/teams/my-team", headers=_headers(member_tokens))
    assert resp.status_code == 200
    assert resp.json()["id"] == team_id


async def test_user_with_no_team_returns_404(client):
    member = await _register_and_login(client, email="lone@example.com", name="Lone")
    resp = await client.get("/api/v1/teams/my-team", headers=_headers(member))
    assert resp.status_code == 404


async def test_team_member_listing_shows_roles(client, db_session):
    admin = await _promote(client, db_session, "boss@example.com", UserRole.ADMINISTRATOR)
    team_resp = await _create_team(client, admin)
    team_id = team_resp.json()["id"]

    emp = await _register_and_login(client, email="emp@example.com", name="Emp")
    rev = await _register_and_login(client, email="rev@example.com", name="Rev")
    await _promote(client, db_session, "rev@example.com", UserRole.REVIEWER)

    for user in (emp, rev):
        await client.patch(
            f"/api/v1/users/{user['id']}/team",
            json={"team_id": team_id},
            headers=_headers(admin),
        )

    resp = await client.get(f"/api/v1/teams/{team_id}", headers=_headers(admin))
    roles = {m["full_name"]: m["role"] for m in resp.json()["members"]}
    assert roles == {"Emp": "employee", "Rev": "reviewer"}


async def test_get_nonexistent_team_returns_404(client):
    member = await _register_and_login(client)
    resp = await client.get(
        "/api/v1/teams/00000000-0000-0000-0000-000000000000", headers=_headers(member)
    )
    assert resp.status_code == 404


async def test_invalid_team_id_returns_422(client):
    member = await _register_and_login(client)
    resp = await client.get("/api/v1/teams/not-a-uuid", headers=_headers(member))
    assert resp.status_code == 422


async def test_employee_cannot_create_team(client):
    employee = await _register_and_login(client)
    resp = await _create_team(client, employee)
    assert resp.status_code == 403


async def test_manager_can_create_team(client, db_session):
    manager = await _promote(client, db_session, "manager@example.com", UserRole.MANAGER)
    resp = await _create_team(client, manager)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Platform"
    assert body["member_count"] == 0
    assert body["decision_count"] == 0


async def test_administrator_can_create_team(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    resp = await _create_team(client, admin)
    assert resp.status_code == 201


async def test_duplicate_team_name_returns_409(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    await _create_team(client, admin, "Unique")
    resp = await _create_team(client, admin, "Unique")
    assert resp.status_code == 409


async def test_employee_cannot_assign_user_to_team(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    team_resp = await _create_team(client, admin)
    team_id = team_resp.json()["id"]

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    resp = await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_id},
        headers=_headers(member),
    )
    assert resp.status_code == 403


async def test_manager_can_assign_user_to_team(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    manager = await _promote(client, db_session, "manager@example.com", UserRole.MANAGER)
    team_resp = await _create_team(client, admin)
    team_id = team_resp.json()["id"]

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    resp = await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_id},
        headers=_headers(manager),
    )
    assert resp.status_code == 200
    assert resp.json()["team_id"] == team_id


async def test_one_user_one_team_blocks_unconfirmed_reassignment(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    team_a = (await _create_team(client, admin, "Team A")).json()["id"]
    team_b = (await _create_team(client, admin, "Team B")).json()["id"]

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_a},
        headers=_headers(admin),
    )

    resp = await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_b},
        headers=_headers(admin),
    )
    assert resp.status_code == 409


async def test_confirmed_reassignment_moves_user(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    team_a = (await _create_team(client, admin, "Team A")).json()["id"]
    team_b = (await _create_team(client, admin, "Team B")).json()["id"]

    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_a},
        headers=_headers(admin),
    )

    resp = await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": team_b, "confirm_reassignment": True},
        headers=_headers(admin),
    )
    assert resp.status_code == 200
    assert resp.json()["team_id"] == team_b


async def test_assign_nonexistent_user_returns_404(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    team_id = (await _create_team(client, admin)).json()["id"]
    resp = await client.patch(
        "/api/v1/users/00000000-0000-0000-0000-000000000000/team",
        json={"team_id": team_id},
        headers=_headers(admin),
    )
    assert resp.status_code == 404


async def test_assign_nonexistent_team_returns_404(client, db_session):
    admin = await _promote(client, db_session, "admin@example.com", UserRole.ADMINISTRATOR)
    member = await _register_and_login(client, email="ada@example.com", name="Ada")
    resp = await client.patch(
        f"/api/v1/users/{member['id']}/team",
        json={"team_id": "00000000-0000-0000-0000-000000000000"},
        headers=_headers(admin),
    )
    assert resp.status_code == 404