import pytest
from sqlalchemy import update

pytestmark = pytest.mark.asyncio

from app.models.user import User, UserRole


async def _register_and_login(client, email="test@example.com", name="Test"):
    await client.post(
        "/api/v1/auth/register",
        json={"full_name": name, "email": email, "password": "password123"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()


def _auth_headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _create_decision(client, tokens):
    resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Test decision", "problem_statement": "Test problem"},
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 201
    return resp.json()


async def test_submit_for_review_transitions_to_under_review(client):
    tokens = await _register_and_login(client)
    decision = await _create_decision(client, tokens)
    assert decision["status"] == "draft"

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "under_review"


async def test_reviewer_can_approve_under_review_decision(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer@test.com", name="Reviewer")
    await db_session.execute(
        update(User).where(User.email == "reviewer@test.com").values(role=UserRole.REVIEWER)
    )
    await db_session.commit()
    reviewer_tokens = await _register_and_login(client, email="reviewer@test.com", name="Reviewer")
    decision = await _create_decision(client, reviewer_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(reviewer_tokens),
    )

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending_manager_review"


async def test_reviewer_rejection_returns_to_draft(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer2@test.com", name="Reviewer Two")
    await db_session.execute(
        update(User).where(User.email == "reviewer2@test.com").values(role=UserRole.REVIEWER)
    )
    await db_session.commit()
    reviewer_tokens = await _register_and_login(client, email="reviewer2@test.com", name="Reviewer Two")
    decision = await _create_decision(client, reviewer_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(reviewer_tokens),
    )

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": "Needs more work"},
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "draft"


async def test_reject_requires_reason(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer3@test.com", name="Reviewer Three")
    await db_session.execute(
        update(User).where(User.email == "reviewer3@test.com").values(role=UserRole.REVIEWER)
    )
    await db_session.commit()
    reviewer_tokens = await _register_and_login(client, email="reviewer3@test.com", name="Reviewer Three")
    decision = await _create_decision(client, reviewer_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(reviewer_tokens),
    )

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": ""},
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 400


async def test_pending_review_endpoint_returns_correct_decisions(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer4@test.com", name="Reviewer Four")
    await db_session.execute(
        update(User).where(User.email == "reviewer4@test.com").values(role=UserRole.REVIEWER)
    )
    await db_session.commit()
    reviewer_tokens = await _register_and_login(client, email="reviewer4@test.com", name="Reviewer Four")
    decision = await _create_decision(client, reviewer_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(reviewer_tokens),
    )

    resp = await client.get(
        "/api/v1/decisions/pending-review",
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["status"] == "under_review"


async def test_approval_history_endpoint(client, db_session):
    reviewer_tokens = await _register_and_login(client, email="reviewer5@test.com", name="Reviewer Five")
    await db_session.execute(
        update(User).where(User.email == "reviewer5@test.com").values(role=UserRole.REVIEWER)
    )
    await db_session.commit()
    reviewer_tokens = await _register_and_login(client, email="reviewer5@test.com", name="Reviewer Five")
    decision = await _create_decision(client, reviewer_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(reviewer_tokens),
    )

    resp = await client.get(
        f"/api/v1/decisions/{decision['id']}/approvals",
        headers=_auth_headers(reviewer_tokens),
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_employee_cannot_approve_or_reject(client, db_session):
    employee_tokens = await _register_and_login(client, email="employee@test.com", name="Employee")
    decision = await _create_decision(client, employee_tokens)
    await client.post(
        f"/api/v1/decisions/{decision['id']}/submit",
        headers=_auth_headers(employee_tokens),
    )

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/approve",
        headers=_auth_headers(employee_tokens),
    )
    assert resp.status_code == 403

    resp = await client.post(
        f"/api/v1/decisions/{decision['id']}/reject",
        json={"reason": "Nope"},
        headers=_auth_headers(employee_tokens),
    )
    assert resp.status_code == 403