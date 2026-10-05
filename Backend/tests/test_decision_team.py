def _register_employee(client, email):
    registered = client.post(
        "/register",
        json={
            "full_name": "Decision Team Test Employee",
            "email": email,
            "password": "password123",
            "role_name": "employee",
        },
    )
    assert registered.status_code == 201
    login = client.post("/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200
    return registered.json(), {"Authorization": f"Bearer {login.json()['access_token']}"}


def _create_team(client, auth_headers, name):
    response = client.post("/teams", json={"name": name}, headers=auth_headers)
    assert response.status_code in (200, 201)
    return response.json()


def _create_decision(client, headers, title, team_id_marker=...):
    payload = {"title": title, "category": "Process"}
    if team_id_marker is not ...:
        payload["team_id"] = team_id_marker
    return client.post("/decisions", json=payload, headers=headers)


def test_decision_creation_without_team_remains_supported(client):
    _, employee_headers = _register_employee(client, "decision-no-team@edrp-test.com")

    response = _create_decision(client, employee_headers, "Decision without a team")

    assert response.status_code == 201
    assert response.json()["team_id"] is None
    assert response.json()["team_name"] is None


def test_employee_can_create_decision_for_their_team(client, auth_headers):
    employee, employee_headers = _register_employee(client, "decision-with-team@edrp-test.com")
    team = _create_team(client, auth_headers, "Decision association valid team")
    assignment = client.put(
        f"/teams/assign/{employee['id']}",
        json={"team_id": team["id"]},
        headers=auth_headers,
    )
    assert assignment.status_code == 200

    response = _create_decision(
        client,
        employee_headers,
        "Decision associated with team",
        team["id"],
    )

    assert response.status_code == 201
    assert response.json()["team_id"] == team["id"]
    assert response.json()["team_name"] == team["name"]

    detail = client.get(f"/decisions/{response.json()['id']}", headers=employee_headers)
    assert detail.status_code == 200
    assert detail.json()["team_name"] == team["name"]


def test_nonexistent_decision_team_is_rejected(client):
    _, employee_headers = _register_employee(client, "decision-unknown-team@edrp-test.com")

    response = _create_decision(
        client,
        employee_headers,
        "Decision with nonexistent team",
        2147483647,
    )

    assert response.status_code == 404


def test_employee_cannot_create_decision_for_another_team(client, auth_headers):
    _, employee_headers = _register_employee(client, "decision-other-team@edrp-test.com")
    team = _create_team(client, auth_headers, "Decision association unauthorized team")

    response = _create_decision(
        client,
        employee_headers,
        "Decision for another employee team",
        team["id"],
    )

    assert response.status_code == 403
