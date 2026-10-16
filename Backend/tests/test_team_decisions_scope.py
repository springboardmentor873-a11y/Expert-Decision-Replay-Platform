"""Test for GET /decisions/team — used by the frontend's Team Decisions page,
which previously showed every decision unfiltered because the scope prop was
silently ignored on the frontend."""


def _register_and_login(client, email, role_name, full_name="Test User"):
    client.post(
        "/register",
        json={
            "full_name": full_name,
            "email": email,
            "password": "password123",
            "role_name": role_name,
        },
    )
    resp = client.post("/login", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_team_decisions_route_is_not_shadowed_by_decision_id_route(client):
    """Regression: /decisions/team must resolve to the team route, not be
    parsed as /decisions/{decision_id} with decision_id="team" (which would
    422 on the int conversion)."""
    headers = _register_and_login(client, "team.dec.manager@example.com", "manager")
    resp = client.get("/decisions/team", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_manager_team_decisions_includes_only_their_team_members(client):
    admin_headers = _register_and_login(client, "team.dec.admin@example.com", "administrator")
    manager_headers = _register_and_login(client, "team.dec.manager2@example.com", "manager")
    outsider_headers = _register_and_login(client, "team.dec.outsider@example.com", "manager")

    manager_id = next(
        u["id"] for u in client.get("/users", headers=admin_headers).json()
        if u["email"] == "team.dec.manager2@example.com"
    )

    team_resp = client.post(
        "/teams", json={"name": "Team Decisions Test Squad", "manager_id": manager_id},
        headers=admin_headers,
    )
    assert team_resp.status_code == 200

    # Manager creates a decision (counts as a team decision since the
    # manager is included in their own team's member_ids)
    client.post(
        "/decisions",
        json={"title": "In-team decision", "category": "Process"},
        headers=manager_headers,
    )
    # An unrelated manager's decision must NOT show up in the first manager's
    # team view
    client.post(
        "/decisions",
        json={"title": "Outsider decision", "category": "Process"},
        headers=outsider_headers,
    )

    resp = client.get("/decisions/team", headers=manager_headers)
    assert resp.status_code == 200
    titles = [d["title"] for d in resp.json()]
    assert "In-team decision" in titles
    assert "Outsider decision" not in titles


def test_decision_out_includes_creator_team_id(client):
    """Regression: the Repository page's team filter dropdown was comparing
    against a field (team_id) that never existed on a Decision at all."""
    manager_headers = _register_and_login(client, "team.dec.manager3@example.com", "manager")
    create_resp = client.post(
        "/decisions",
        json={"title": "Field check decision", "category": "Process"},
        headers=manager_headers,
    )
    assert create_resp.status_code == 201
    assert "creator_team_id" in create_resp.json()
