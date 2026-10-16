"""Regression test for the stale-role bug: an admin changing someone's role
must be visible via /me right away, using the SAME still-logged-in token —
no re-login should be required for the affected user's authority to update."""


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


def test_me_includes_role_name(client):
    headers = _register_and_login(client, "role.emp@example.com", "employee")
    resp = client.get("/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["role"] == "employee"


def test_role_change_is_reflected_on_me_without_relogin(client):
    admin_headers = _register_and_login(client, "role.admin@example.com", "administrator")
    employee_headers = _register_and_login(client, "role.promote@example.com", "employee")

    # This is the SAME token issued at the original (employee) login.
    before = client.get("/me", headers=employee_headers)
    assert before.json()["role"] == "employee"

    users = client.get("/users", headers=admin_headers).json()
    target_id = next(u["id"] for u in users if u["email"] == "role.promote@example.com")

    promote_resp = client.put(
        f"/users/{target_id}/role", json={"role_name": "manager"}, headers=admin_headers
    )
    assert promote_resp.status_code == 200
    assert promote_resp.json()["role"] == "manager"

    # Still using the OLD token — /me must now report the NEW role.
    after = client.get("/me", headers=employee_headers)
    assert after.json()["role"] == "manager"

    # And the newly-promoted permission actually works with the old token.
    create_resp = client.post(
        "/decisions",
        json={"title": "Promoted user can now create this", "category": "Process"},
        headers=employee_headers,
    )
    assert create_resp.status_code == 201
