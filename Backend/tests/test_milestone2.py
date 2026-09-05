import io

import pytest


@pytest.fixture(scope="module")
def seeded_decision_id(client, auth_headers):
    resp = client.post(
        "/decisions",
        json={
            "title": "Adopt microservices architecture",
            "category": "Architecture",
            "problem_statement": "The monolith is becoming difficult to scale.",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_create_and_get_decision(client, auth_headers, seeded_decision_id):
    resp = client.get(f"/decisions/{seeded_decision_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["version"] == 1
    assert resp.json()["status"] == "Draft"


def test_list_and_filter_decisions(client, auth_headers, seeded_decision_id):
    resp = client.get("/decisions", headers=auth_headers)
    assert resp.status_code == 200
    ids = [d["id"] for d in resp.json()]
    assert seeded_decision_id in ids

    resp = client.get("/decisions?category=Architecture", headers=auth_headers)
    assert all(d["category"] == "Architecture" for d in resp.json())


def test_alternatives_and_recommendation(client, auth_headers, seeded_decision_id):
    client.post(
        f"/decisions/{seeded_decision_id}/alternatives",
        json={
            "title": "Kubernetes on AWS EKS",
            "pros": "Scales well",
            "cons": "Operational complexity",
            "estimated_cost": 8000,
            "risk_score": 4,
            "feasibility_score": 8,
        },
        headers=auth_headers,
    )
    client.post(
        f"/decisions/{seeded_decision_id}/alternatives",
        json={
            "title": "Stay on the monolith",
            "pros": "No migration effort",
            "cons": "Scaling problems persist",
            "estimated_cost": 500,
            "risk_score": 8,
            "feasibility_score": 3,
        },
        headers=auth_headers,
    )

    resp = client.get(f"/decisions/{seeded_decision_id}/alternatives", headers=auth_headers)
    assert resp.status_code == 200
    alts = resp.json()
    assert len(alts) == 2
    recommended = [a for a in alts if a["is_recommended"] == 1]
    assert len(recommended) == 1
    assert recommended[0]["title"] == "Kubernetes on AWS EKS"


def test_comments_thread(client, auth_headers, seeded_decision_id):
    resp = client.post(
        f"/decisions/{seeded_decision_id}/comments",
        json={"content": "What about vendor lock-in?"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    parent_id = resp.json()["id"]

    resp = client.post(
        f"/decisions/{seeded_decision_id}/comments",
        json={"content": "We already use multi-cloud tooling.", "parent_id": parent_id},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    resp = client.get(f"/decisions/{seeded_decision_id}/comments", headers=auth_headers)
    assert len(resp.json()) == 2


def test_employee_cannot_update_others_decision(client, auth_headers, employee_headers, seeded_decision_id):
    resp = client.put(
        f"/decisions/{seeded_decision_id}",
        json={"status": "Approved", "change_summary": "sneaky"},
        headers=employee_headers,
    )
    assert resp.status_code == 403


def test_manager_can_update_decision_and_versions_recorded(
    client, manager_token, seeded_decision_id
):
    headers = {"Authorization": f"Bearer {manager_token}"}
    resp = client.put(
        f"/decisions/{seeded_decision_id}",
        json={"status": "Approved", "change_summary": "Approved after review"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Approved"
    assert resp.json()["version"] == 2

    resp = client.get(f"/decisions/{seeded_decision_id}/versions", headers=headers)
    assert resp.status_code == 200
    versions = resp.json()
    assert len(versions) == 2
    assert versions[-1]["change_summary"] == "Approved after review"


def test_file_upload_and_listing(client, auth_headers, seeded_decision_id):
    file_content = b"cost breakdown: eks=8000, monolith=500"
    resp = client.post(
        f"/decisions/{seeded_decision_id}/upload",
        files={"file": ("cost_comparison.txt", io.BytesIO(file_content), "text/plain")},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["filename"] == "cost_comparison.txt"

    resp = client.get(f"/decisions/{seeded_decision_id}/attachments", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_only_admin_can_delete_decision(client, employee_headers, auth_headers):
    create = client.post(
        "/decisions",
        json={"title": "Throwaway decision", "category": "Process"},
        headers=auth_headers,
    )
    decision_id = create.json()["id"]

    resp = client.delete(f"/decisions/{decision_id}", headers=employee_headers)
    assert resp.status_code == 403

    resp = client.delete(f"/decisions/{decision_id}", headers=auth_headers)
    assert resp.status_code == 204
