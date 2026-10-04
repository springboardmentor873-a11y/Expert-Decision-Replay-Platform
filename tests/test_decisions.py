from tests.conftest import login, auth_headers


def create_decision(client, token, title="Sample Decision"):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": title,
        "problem_statement": "A problem that needs solving",
        "category": "Process",
        "tags": "test",
    })
    assert r.status_code == 201, r.text
    return r.json()


def test_create_and_get_decision(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)
    assert decision["status"] == "Draft"

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["title"] == "Sample Decision"


def test_list_decisions_scoped_to_owner_for_employee(client, employee, other_employee):
    token = login(client, employee.email)
    other_token = login(client, other_employee.email)

    create_decision(client, token, title="Employee A decision")
    create_decision(client, other_token, title="Employee B decision")

    r = client.get("/decisions", headers=auth_headers(token))
    titles = [d["title"] for d in r.json()]
    assert "Employee A decision" in titles
    assert "Employee B decision" not in titles


def test_employee_cannot_view_others_decision(client, employee, other_employee):
    token = login(client, employee.email)
    other_token = login(client, other_employee.email)

    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(other_token))
    assert r.status_code == 403


def test_manager_can_view_department_decision(client, employee, manager):
    # employee and manager share department="IT" by fixture default
    token = login(client, employee.email)
    mgr_token = login(client, manager.email)

    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(mgr_token))
    assert r.status_code == 200


def test_administrator_sees_all_decisions(client, employee, administrator):
    token = login(client, employee.email)
    admin_token = login(client, administrator.email)

    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}", headers=auth_headers(admin_token))
    assert r.status_code == 200


def test_update_decision(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.put(f"/decisions/{decision['id']}", headers=auth_headers(token), json={
        "title": "Updated title",
        "problem_statement": "Updated problem",
        "category": "Process",
        "tags": "updated",
    })
    assert r.status_code == 200
    assert r.json()["title"] == "Updated title"

    history = client.get(f"/decisions/{decision['id']}/history", headers=auth_headers(token))
    assert history.status_code == 200
    assert len(history.json()) == 1


def test_cannot_directly_set_status_to_approved(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.patch(
        f"/decisions/{decision['id']}/status",
        headers=auth_headers(token),
        json={"status": "Approved"},
    )
    assert r.status_code == 400


def test_valid_status_transition(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.patch(
        f"/decisions/{decision['id']}/status",
        headers=auth_headers(token),
        json={"status": "Under Review"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "Under Review"


def test_decision_replay_contains_creation_event(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}/replay", headers=auth_headers(token))
    assert r.status_code == 200
    types_seen = [e["type"] for e in r.json()["timeline"]]
    assert "DECISION_CREATED" in types_seen
