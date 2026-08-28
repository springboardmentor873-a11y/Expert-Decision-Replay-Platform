import pytest
from fastapi.testclient import TestClient


def test_discussions_comments_and_notes(
    client: TestClient,
    employee_user: tuple,
    reviewer_user: tuple,
) -> None:
    _, _, emp_headers = employee_user
    _, _, rev_headers = reviewer_user

    # 1. Create Decision
    d_res = client.post(
        "/api/v1/decisions",
        json={"title": "Collaboration Test Decision", "problem_statement": "Testing discussion and meeting notes."},
        headers=emp_headers,
    )
    decision_id = d_res.json()["id"]

    # 2. Create Discussion Thread
    disc_res = client.post(
        f"/api/v1/decisions/{decision_id}/discussions",
        json={"title": "Security & Threat Modeling Review", "initial_comment": "Has the network topology been verified?"},
        headers=emp_headers,
    )
    assert disc_res.status_code == 201
    disc_id = disc_res.json()["id"]
    assert len(disc_res.json()["comments"]) == 1
    parent_comment_id = disc_res.json()["comments"][0]["id"]

    # 3. Add Reply (nested comment)
    reply_res = client.post(
        f"/api/v1/discussions/{disc_id}/comments",
        json={"body": "Yes, VPC peering and ingress rules are configured.", "parent_id": parent_comment_id},
        headers=rev_headers,
    )
    assert reply_res.status_code == 201
    assert reply_res.json()["parent_id"] == parent_comment_id

    # 4. Add Meeting Note
    note_res = client.post(
        f"/api/v1/decisions/{decision_id}/meeting-notes",
        json={"title": "SecOps Alignment Meeting", "body": "Discussed firewall requirements. All clear.", "occurred_at": "2026-08-24T12:00:00Z"},
        headers=emp_headers,
    )
    assert note_res.status_code == 201
    assert note_res.json()["title"] == "SecOps Alignment Meeting"
