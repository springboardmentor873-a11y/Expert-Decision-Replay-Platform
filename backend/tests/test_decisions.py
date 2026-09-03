import pytest

pytestmark = pytest.mark.asyncio


async def _register_and_login(client, email="creator@example.com", name="Creator"):
    await client.post(
        "/api/v1/auth/register",
        json={"full_name": name, "email": email, "password": "password123"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()


def _auth_headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def test_create_decision_starts_as_draft(client):
    tokens = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Choose a CI provider", "problem_statement": "Builds are too slow.", "category": "tooling"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "draft"
    assert body["title"] == "Choose a CI provider"


async def test_create_decision_requires_auth(client):
    resp = await client.post(
        "/api/v1/decisions", json={"title": "X", "problem_statement": "Y"}
    )
    assert resp.status_code == 401


async def test_list_decisions_returns_created_ones(client):
    tokens = await _register_and_login(client)
    await client.post(
        "/api/v1/decisions",
        json={"title": "Decision A", "problem_statement": "Problem A"},
        headers=_auth_headers(tokens),
    )
    resp = await client.get("/api/v1/decisions", headers=_auth_headers(tokens))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_get_decision_detail_includes_empty_alternatives_and_attachments(client):
    tokens = await _register_and_login(client)
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Decision A", "problem_statement": "Problem A"},
        headers=_auth_headers(tokens),
    )
    decision_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/decisions/{decision_id}", headers=_auth_headers(tokens))
    assert resp.status_code == 200
    body = resp.json()
    assert body["alternatives"] == []
    assert body["attachments"] == []


async def test_get_nonexistent_decision_returns_404(client):
    tokens = await _register_and_login(client)
    resp = await client.get(
        "/api/v1/decisions/00000000-0000-0000-0000-000000000000", headers=_auth_headers(tokens)
    )
    assert resp.status_code == 404


async def test_creator_can_edit_own_draft(client):
    tokens = await _register_and_login(client)
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Original title", "problem_statement": "Original problem"},
        headers=_auth_headers(tokens),
    )
    decision_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/v1/decisions/{decision_id}",
        json={"title": "Updated title"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated title"


async def test_other_employee_cannot_edit_someone_elses_draft(client):
    owner_tokens = await _register_and_login(client, email="owner@example.com", name="Owner")
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Owner's decision", "problem_statement": "Problem"},
        headers=_auth_headers(owner_tokens),
    )
    decision_id = create_resp.json()["id"]

    other_tokens = await _register_and_login(client, email="other@example.com", name="Other")
    resp = await client.patch(
        f"/api/v1/decisions/{decision_id}",
        json={"title": "Hijacked title"},
        headers=_auth_headers(other_tokens),
    )
    assert resp.status_code == 403


async def test_submit_for_review_changes_status_and_locks_editing(client):
    tokens = await _register_and_login(client)
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Ready decision", "problem_statement": "Problem statement here"},
        headers=_auth_headers(tokens),
    )
    decision_id = create_resp.json()["id"]

    submit_resp = await client.post(
        f"/api/v1/decisions/{decision_id}/submit", headers=_auth_headers(tokens)
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "under_review"

    # Now that it's under review, editing should be blocked even for the creator
    edit_resp = await client.patch(
        f"/api/v1/decisions/{decision_id}",
        json={"title": "Too late"},
        headers=_auth_headers(tokens),
    )
    assert edit_resp.status_code == 409


async def test_add_alternative_to_own_draft(client):
    tokens = await _register_and_login(client)
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Decision", "problem_statement": "Problem"},
        headers=_auth_headers(tokens),
    )
    decision_id = create_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "Option A", "pros": "Fast", "cons": "Expensive", "estimated_cost": 5000},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Option A"
    assert body["estimated_cost"] == 5000.0


async def test_cannot_add_alternative_after_submitted(client):
    tokens = await _register_and_login(client)
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Decision", "problem_statement": "Problem"},
        headers=_auth_headers(tokens),
    )
    decision_id = create_resp.json()["id"]
    await client.post(f"/api/v1/decisions/{decision_id}/submit", headers=_auth_headers(tokens))

    resp = await client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "Too late option"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 409


async def test_delete_alternative(client):
    tokens = await _register_and_login(client)
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Decision", "problem_statement": "Problem"},
        headers=_auth_headers(tokens),
    )
    decision_id = create_resp.json()["id"]
    alt_resp = await client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "Option A"},
        headers=_auth_headers(tokens),
    )
    alt_id = alt_resp.json()["id"]

    delete_resp = await client.delete(
        f"/api/v1/decisions/{decision_id}/alternatives/{alt_id}", headers=_auth_headers(tokens)
    )
    assert delete_resp.status_code == 204

    detail_resp = await client.get(f"/api/v1/decisions/{decision_id}", headers=_auth_headers(tokens))
    assert detail_resp.json()["alternatives"] == []


async def test_manager_can_edit_someone_elses_draft(client, db_session):
    owner_tokens = await _register_and_login(client, email="owner2@example.com", name="Owner Two")
    create_resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Owner's decision", "problem_statement": "Problem"},
        headers=_auth_headers(owner_tokens),
    )
    decision_id = create_resp.json()["id"]

    await _register_and_login(client, email="manager@example.com", name="Manager")

    # Promote directly via the test DB, same pattern as the milestone-1 auth tests
    from sqlalchemy import update
    from app.models.user import User, UserRole

    await db_session.execute(
        update(User).where(User.email == "manager@example.com").values(role=UserRole.MANAGER)
    )
    await db_session.commit()

    # Re-login so the JWT carries the updated role
    manager_tokens = (await client.post(
        "/api/v1/auth/login", json={"email": "manager@example.com", "password": "password123"}
    )).json()

    resp = await client.patch(
        f"/api/v1/decisions/{decision_id}",
        json={"title": "Manager edited this"},
        headers=_auth_headers(manager_tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Manager edited this"
