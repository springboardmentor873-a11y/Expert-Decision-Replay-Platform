import pytest


def test_get_decision_ai_summary(client, auth_headers):
    # 1. Create a decision
    d_resp = client.post(
        "/decisions",
        json={
            "title": "Adopt Redis Cache Layer",
            "problem_statement": "Reduce database read latency for frequent queries",
            "category": "Infrastructure",
            "rationale": "In-memory caching scales sub-millisecond responses",
        },
        headers=auth_headers,
    )
    assert d_resp.status_code == 201
    decision_id = d_resp.json()["id"]

    # 2. Add an alternative option
    client.post(
        f"/decisions/{decision_id}/alternatives",
        json={
            "title": "Redis Cluster",
            "pros": "High performance, pub-sub support",
            "cons": "Memory usage monitoring needed",
            "estimated_cost": 250.0,
            "risk_score": 2.0,
            "feasibility_score": 9.0,
        },
        headers=auth_headers,
    )

    # 3. Request AI Summary
    ai_resp = client.get(f"/decisions/{decision_id}/ai-summary", headers=auth_headers)
    assert ai_resp.status_code == 200
    data = ai_resp.json()
    assert data["decision_id"] == decision_id
    assert "Redis Cache Layer" in data["title"]
    assert "executive_summary" in data
    assert data["risk_assessment"]["risk_level"] in ("Low", "Medium", "High")
    assert data["recommended_alternative"] == "Redis Cluster"
    assert len(data["key_insights"]) >= 3
