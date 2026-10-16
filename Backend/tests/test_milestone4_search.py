import pytest


def test_search_decisions_by_keyword(client, auth_headers):
    # 1. Create decisions for testing search
    d1 = client.post(
        "/decisions",
        json={
            "title": "Migrate to Kubernetes Cluster",
            "problem_statement": "Deploy microservices on modern orchestrator",
            "category": "Infrastructure",
            "rationale": "High availability and scaling",
        },
        headers=auth_headers,
    )
    assert d1.status_code == 201

    d2 = client.post(
        "/decisions",
        json={
            "title": "Adopt GraphQL API Gateway",
            "problem_statement": "Reduce network roundtrips for mobile clients",
            "category": "Architecture",
            "rationale": "Improved client query flexibility",
        },
        headers=auth_headers,
    )
    assert d2.status_code == 201

    # 2. Search keyword "Kubernetes"
    resp = client.get("/decisions/search?q=Kubernetes", headers=auth_headers)
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("Kubernetes" in r["title"] for r in results)

    # 3. Search keyword "orchestrator" in problem statement
    resp = client.get("/decisions/search?q=orchestrator", headers=auth_headers)
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("Kubernetes" in r["title"] for r in results)


def test_search_decisions_by_category_and_status(client, auth_headers):
    resp = client.get(
        "/decisions/search?category=Architecture&sort_by=title_asc",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    results = resp.json()
    assert all(r["category"] == "Architecture" for r in results)
