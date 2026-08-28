import pytest
from fastapi.testclient import TestClient


def test_create_and_read_decision(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, headers = employee_user

    payload = {
        "title": "Migrate Data Pipeline to Apache Iceberg",
        "problem_statement": "The existing Parquet datalake tables lack ACID atomicity during concurrent writes, resulting in corrupted partial reads.",
    }
    create_res = client.post("/api/v1/decisions", json=payload, headers=headers)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["title"] == payload["title"]
    assert data["status"] == "draft"
    assert data["current_version_no"] == 1
    decision_id = data["id"]

    # Read back
    get_res = client.get(f"/api/v1/decisions/{decision_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == decision_id


def test_update_decision_creates_version(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, headers = employee_user

    create_res = client.post(
        "/api/v1/decisions",
        json={
            "title": "Version Tracking Test Decision Case",
            "problem_statement": "Testing version history increment upon detail modifications.",
        },
        headers=headers,
    )
    decision_id = create_res.json()["id"]
    assert create_res.json()["current_version_no"] == 1

    # Update decision
    update_res = client.put(
        f"/api/v1/decisions/{decision_id}",
        json={"title": "Updated Title for Version Tracking"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["current_version_no"] == 2

    # Check versions list
    ver_res = client.get(f"/api/v1/decisions/{decision_id}/versions", headers=headers)
    assert ver_res.status_code == 200
    versions = ver_res.json()
    assert len(versions) == 2

    # Check compare endpoint
    diff_res = client.get(f"/api/v1/decisions/{decision_id}/versions/compare?v1=1&v2=2", headers=headers)
    assert diff_res.status_code == 200
    diffs = diff_res.json()["differences"]
    assert "title" in diffs
    assert diffs["title"]["old"] == "Version Tracking Test Decision Case"
    assert diffs["title"]["new"] == "Updated Title for Version Tracking"


def test_record_outcome(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, headers = employee_user

    create_res = client.post(
        "/api/v1/decisions",
        json={"title": "Outcome Test Decision", "problem_statement": "Evaluating final outcome rationale recording."},
        headers=headers,
    )
    decision_id = create_res.json()["id"]

    out_res = client.post(
        f"/api/v1/decisions/{decision_id}/outcome",
        json={"outcome_summary": "Implementation completed on schedule with zero downtime.", "implementation_status": "completed"},
        headers=headers,
    )
    assert out_res.status_code == 200
    assert out_res.json()["outcome_summary"] == "Implementation completed on schedule with zero downtime."
    assert out_res.json()["implementation_status"] == "completed"
