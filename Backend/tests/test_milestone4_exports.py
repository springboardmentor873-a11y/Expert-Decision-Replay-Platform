import pytest


def test_export_single_decision_pdf(client, auth_headers):
    # 1. Create a decision
    d_resp = client.post(
        "/decisions",
        json={
            "title": "Adopt Event-Driven Microservices",
            "problem_statement": "Decouple synchronous REST API calls",
            "category": "Architecture",
            "rationale": "Asynchronous messaging improves resiliency",
        },
        headers=auth_headers,
    )
    assert d_resp.status_code == 201
    decision_id = d_resp.json()["id"]

    # 2. Add an alternative
    alt_resp = client.post(
        f"/decisions/{decision_id}/alternatives",
        json={
            "title": "Apache Kafka Event Bus",
            "pros": "High throughput, durable offset tracking",
            "cons": "Operational complexity",
            "estimated_cost": 500.0,
            "risk_score": 3.0,
            "feasibility_score": 8.5,
        },
        headers=auth_headers,
    )
    assert alt_resp.status_code == 201

    # 3. Export PDF
    pdf_resp = client.get(f"/reports/decisions/{decision_id}/export/pdf", headers=auth_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert b"%PDF" in pdf_resp.content[:10]


def test_export_executive_decisions_pdf(client, auth_headers):
    pdf_resp = client.get("/reports/decisions/export/pdf", headers=auth_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert b"%PDF" in pdf_resp.content[:10]
