def _create_team(client, headers, name, manager_id=None):
    payload = {"name": name}
    if manager_id is not None:
        payload["manager_id"] = manager_id
    return client.post("/teams", json=payload, headers=headers)


def _register_and_get_headers(client, email, role_name):
    registered = client.post(
        "/register",
        json={
            "full_name": f"{role_name.title()} Test User",
            "email": email,
            "password": "password123",
            "role_name": role_name,
        },
    )
    assert registered.status_code == 201
    login = client.post("/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_administrator_can_view_team_members(client, auth_headers, employee_headers):
    employee = client.get("/me", headers=employee_headers).json()
    team = _create_team(client, auth_headers, "M3 administrator member access")
    assert team.status_code in (200, 201)

    assigned = client.put(
        f"/teams/assign/{employee['id']}",
        json={"team_id": team.json()["id"]},
        headers=auth_headers,
    )
    assert assigned.status_code == 200

    response = client.get(f"/teams/{team.json()['id']}/members", headers=auth_headers)
    assert response.status_code == 200
    members = response.json()
    assert any(
        member["id"] == employee["id"]
        and member["full_name"] == employee["full_name"]
        and member["email"] == employee["email"]
        and member["role"] == "employee"
        for member in members
    )
    assert all("hashed_password" not in member for member in members)


def test_manager_can_view_managed_and_assigned_team_members(
    client, auth_headers, employee_headers, manager_token
):
    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    manager = client.get("/me", headers=manager_headers).json()
    employee = client.get("/me", headers=employee_headers).json()

    managed_team = _create_team(
        client,
        auth_headers,
        "M3 manager-owned team",
        manager_id=manager["id"],
    )
    assert managed_team.status_code in (200, 201)
    assert client.put(
        f"/teams/assign/{employee['id']}",
        json={"team_id": managed_team.json()["id"]},
        headers=auth_headers,
    ).status_code == 200

    managed_members = client.get(
        f"/teams/{managed_team.json()['id']}/members",
        headers=manager_headers,
    )
    assert managed_members.status_code == 200
    assert any(member["id"] == employee["id"] for member in managed_members.json())

    assigned_team = _create_team(client, auth_headers, "M3 manager-assigned team")
    assert assigned_team.status_code in (200, 201)
    assert client.put(
        f"/teams/assign/{manager['id']}",
        json={"team_id": assigned_team.json()["id"]},
        headers=auth_headers,
    ).status_code == 200
    assert client.put(
        f"/teams/assign/{employee['id']}",
        json={"team_id": assigned_team.json()["id"]},
        headers=auth_headers,
    ).status_code == 200

    assigned_members = client.get(
        f"/teams/{assigned_team.json()['id']}/members",
        headers=manager_headers,
    )
    assert assigned_members.status_code == 200
    assert any(member["id"] == employee["id"] for member in assigned_members.json())


def test_manager_cannot_view_another_managers_team(client, auth_headers, manager_token):
    other_manager_headers = _register_and_get_headers(
        client,
        "m3-other-manager@edrp-test.com",
        "manager",
    )
    other_manager = client.get("/me", headers=other_manager_headers).json()
    team = _create_team(
        client,
        auth_headers,
        "M3 restricted manager team",
        manager_id=other_manager["id"],
    )
    assert team.status_code in (200, 201)

    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    response = client.get(f"/teams/{team.json()['id']}/members", headers=manager_headers)
    assert response.status_code == 403


def test_employee_and_reviewer_cannot_view_team_members(client, auth_headers, employee_headers):
    team = _create_team(client, auth_headers, "M3 restricted member details")
    assert team.status_code in (200, 201)

    employee_response = client.get(
        f"/teams/{team.json()['id']}/members",
        headers=employee_headers,
    )
    assert employee_response.status_code == 403

    reviewer_headers = _register_and_get_headers(
        client,
        "m3-reviewer@edrp-test.com",
        "reviewer",
    )
    reviewer_response = client.get(
        f"/teams/{team.json()['id']}/members",
        headers=reviewer_headers,
    )
    assert reviewer_response.status_code == 403


def test_non_manager_manager_id_does_not_create_team(client, auth_headers, employee_headers):
    employee = client.get("/me", headers=employee_headers).json()
    team_name = "M3 invalid manager id team"

    response = _create_team(client, auth_headers, team_name, manager_id=employee["id"])
    assert response.status_code == 400
    assert not any(team["name"] == team_name for team in client.get("/teams").json())


def test_team_creation_without_manager_remains_compatible(client, auth_headers):
    response = _create_team(client, auth_headers, "M3 no manager compatibility")
    assert response.status_code in (200, 201)
    assert response.json()["manager_id"] is None


def test_existing_team_assignment_behavior_remains_compatible(
    client, auth_headers, employee_headers
):
    employee = client.get("/me", headers=employee_headers).json()
    team = _create_team(client, auth_headers, "M3 assignment compatibility")
    assert team.status_code in (200, 201)

    assignment = client.put(
        f"/teams/assign/{employee['id']}",
        json={"team_id": team.json()["id"]},
        headers=auth_headers,
    )
    assert assignment.status_code == 200
    assert assignment.json()["message"]
    updated_employee = client.get("/me", headers=employee_headers).json()
    assert updated_employee["team_id"] == team.json()["id"]
