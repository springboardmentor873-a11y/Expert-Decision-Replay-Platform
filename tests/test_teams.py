from tests.conftest import login, auth_headers


def test_manager_creates_team_and_adds_member(client, manager, employee):
    mgr_token = login(client, manager.email)

    r = client.post(
        "/teams",
        headers=auth_headers(mgr_token),
        json={"name": "Platform Squad", "department": "IT"},
    )
    assert r.status_code == 201, r.text
    team = r.json()
    assert team["member_count"] == 0

    r = client.post(
        f"/teams/{team['id']}/members",
        headers=auth_headers(mgr_token),
        json={"user_id": employee.id},
    )
    assert r.status_code == 200
    assert r.json()["member_count"] == 1
    assert r.json()["members"][0]["email"] == employee.email


def test_employee_cannot_create_team(client, employee):
    token = login(client, employee.email)
    r = client.post(
        "/teams",
        headers=auth_headers(token),
        json={"name": "Rogue Team", "department": "IT"},
    )
    assert r.status_code == 403


def test_employee_only_sees_own_department_teams(client, employee, manager, db_session):
    mgr_token = login(client, manager.email)
    client.post("/teams", headers=auth_headers(mgr_token), json={"name": "IT Team", "department": "IT"})
    client.post("/teams", headers=auth_headers(mgr_token), json={"name": "CAC Team", "department": "CAC"})

    token = login(client, employee.email)  # employee is department=IT by fixture
    r = client.get("/teams", headers=auth_headers(token))
    names = [t["name"] for t in r.json()]
    assert "IT Team" in names
    assert "CAC Team" not in names


def test_remove_team_member(client, manager, employee):
    mgr_token = login(client, manager.email)
    team = client.post(
        "/teams", headers=auth_headers(mgr_token), json={"name": "Removal Team", "department": "IT"}
    ).json()
    client.post(f"/teams/{team['id']}/members", headers=auth_headers(mgr_token), json={"user_id": employee.id})

    r = client.delete(f"/teams/{team['id']}/members/{employee.id}", headers=auth_headers(mgr_token))
    assert r.status_code == 200

    detail = client.get(f"/teams/{team['id']}", headers=auth_headers(mgr_token)).json()
    assert detail["member_count"] == 0
