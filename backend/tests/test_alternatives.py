import pytest
from fastapi.testclient import TestClient


def test_alternatives_and_evaluation_matrix(
    client: TestClient,
    employee_user: tuple,
) -> None:
    _, _, headers = employee_user

    # 1. Create Decision
    d_res = client.post(
        "/api/v1/decisions",
        json={
            "title": "Select Primary Cloud Provider for Multi-Region DR",
            "problem_statement": "Selecting secondary cloud region provider for disaster recovery warm-standby.",
        },
        headers=headers,
    )
    decision_id = d_res.json()["id"]

    # 2. Add Criteria
    c1_res = client.post(
        f"/api/v1/decisions/{decision_id}/criteria",
        json={"name": "Network Egress Pricing", "weight": 2.0, "sort_order": 1},
        headers=headers,
    )
    assert c1_res.status_code == 201
    c1_id = c1_res.json()["id"]

    c2_res = client.post(
        f"/api/v1/decisions/{decision_id}/criteria",
        json={"name": "Managed Kubernetes SLA", "weight": 3.0, "sort_order": 2},
        headers=headers,
    )
    assert c2_res.status_code == 201
    c2_id = c2_res.json()["id"]

    # 3. Add Alternatives
    a1_res = client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "AWS Cloud", "description": "Amazon Web Services US-East / EU-West", "sort_order": 1},
        headers=headers,
    )
    assert a1_res.status_code == 201
    a1_id = a1_res.json()["id"]

    a2_res = client.post(
        f"/api/v1/decisions/{decision_id}/alternatives",
        json={"title": "GCP Cloud", "description": "Google Cloud Platform", "sort_order": 2},
        headers=headers,
    )
    assert a2_res.status_code == 201
    a2_id = a2_res.json()["id"]

    # 4. Record Evaluation Scores
    # Alt 1: c1=80 (wt 2), c2=90 (wt 3) => (80*2 + 90*3) / 5 = (160 + 270) / 5 = 430/5 = 86.0
    # Alt 2: c1=95 (wt 2), c2=85 (wt 3) => (95*2 + 85*3) / 5 = (190 + 255) / 5 = 445/5 = 89.0
    batch_payload = {
        "evaluations": [
            {"alternative_id": a1_id, "criterion_id": c1_id, "score": 80.0, "notes": "Standard egress"},
            {"alternative_id": a1_id, "criterion_id": c2_id, "score": 90.0, "notes": "99.95% SLA"},
            {"alternative_id": a2_id, "criterion_id": c1_id, "score": 95.0, "notes": "Free tier egress"},
            {"alternative_id": a2_id, "criterion_id": c2_id, "score": 85.0, "notes": "99.9% SLA"},
        ]
    }
    batch_res = client.post(
        f"/api/v1/decisions/{decision_id}/evaluations/batch",
        json=batch_payload,
        headers=headers,
    )
    assert batch_res.status_code == 200

    # 5. Check Matrix & Calculated Total Scores
    matrix_res = client.get(f"/api/v1/decisions/{decision_id}/evaluation-matrix", headers=headers)
    assert matrix_res.status_code == 200
    matrix = matrix_res.json()
    alt_map = {a["id"]: a["total_score"] for a in matrix["alternatives"]}
    assert alt_map[a1_id] == 86.0
    assert alt_map[a2_id] == 89.0

    # 6. Select Alternative 2
    sel_res = client.post(
        f"/api/v1/decisions/{decision_id}/select-alternative",
        json={"alternative_id": a2_id},
        headers=headers,
    )
    assert sel_res.status_code == 200
    assert sel_res.json()["is_selected"] is True
