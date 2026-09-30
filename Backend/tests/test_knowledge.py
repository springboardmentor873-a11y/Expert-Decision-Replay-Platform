"""Tests for the read-only Knowledge Repository."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.models.decision import Decision, DecisionStatus
from app.models.repository_document import RepositoryDocument
from app.models.team import Team
from app.models.user import User, UserRole

PASSWORD = "password123"


async def _register_and_login(client, full_name, email, password=PASSWORD):
    await client.post(
        "/api/v1/auth/register",
        json={"full_name": full_name, "email": email, "password": password},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def _set_role(db_session, email: str, role: UserRole) -> User:
    user = (
        await db_session.execute(select(User).where(User.email == email))
    ).scalars().one()
    user.role = role
    await db_session.commit()
    return user


async def _seed_basics(db_session, tmp_path) -> dict:
    team1 = Team(name="AI & Machine Learning", description="ML team")
    team2 = Team(name="Research & Innovation", description="Research team")
    db_session.add_all([team1, team2])
    await db_session.flush()

    user1 = User(
        full_name="Rahul Sharma",
        email="rahul@example.com",
        hashed_password="hashed",
        role=UserRole.REVIEWER,
        team_id=team1.id,
    )
    user2 = User(
        full_name="Priya Singh",
        email="priya@example.com",
        hashed_password="hashed",
        role=UserRole.EMPLOYEE,
        team_id=team2.id,
    )
    user3 = User(
        full_name="Lonely User",
        email="lonely@example.com",
        hashed_password="hashed",
        role=UserRole.EMPLOYEE,
        team_id=None,
    )
    db_session.add_all([user1, user2, user3])
    await db_session.flush()

    decision = Decision(
        title="AI Model Evaluation Decision",
        problem_statement="Evaluate the current recommendation model.",
        category="Strategy",
        status=DecisionStatus.DRAFT,
        created_by=user1.id,
        team_id=team1.id,
    )
    db_session.add(decision)
    await db_session.flush()

    demo_file = tmp_path / "ai-model-evaluation-report.txt"
    demo_file.write_text("demo content for the report", encoding="utf-8")

    doc1 = RepositoryDocument(
        title="AI Model Evaluation Report.pdf",
        description="Evaluation results for the recommendation model.",
        team_id=team1.id,
        uploaded_by=user1.id,
        decision_id=decision.id,
        file_type="pdf",
        file_size_bytes=demo_file.stat().st_size,
        content_path=str(demo_file),
        content_type="text/plain",
        tags=["AI", "Evaluation", "Research"],
        created_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    doc2 = RepositoryDocument(
        title="Database Architecture.docx",
        description="Data layer architecture notes.",
        team_id=team1.id,
        uploaded_by=user1.id,
        decision_id=None,
        file_type="docx",
        file_size_bytes=2048,
        content_path=None,
        content_type=None,
        tags=["Database", "Architecture"],
        created_at=datetime.now(timezone.utc) - timedelta(days=10),
    )
    doc3 = RepositoryDocument(
        title="Research Methodology.pdf",
        description="Shared methodology for experiments.",
        team_id=team2.id,
        uploaded_by=user2.id,
        decision_id=None,
        file_type="pdf",
        file_size_bytes=4096,
        content_path=None,
        content_type=None,
        tags=["Research", "Methodology"],
        created_at=datetime.now(timezone.utc) - timedelta(days=20),
    )
    db_session.add_all([doc1, doc2, doc3])
    await db_session.commit()

    return {
        "team1": team1,
        "team2": team2,
        "user1": user1,
        "user2": user2,
        "user3": user3,
        "decision": decision,
        "doc1": doc1,
        "doc2": doc2,
        "doc3": doc3,
        "demo_file": demo_file,
    }


@pytest.mark.asyncio
async def test_knowledge_requires_auth(client):
    for path in ["/api/v1/knowledge/summary", "/api/v1/knowledge/documents", "/api/v1/knowledge/graph"]:
        response = await client.get(path)
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_all_roles_can_access_repository(client, db_session):
    for role, email in [
        (UserRole.EMPLOYEE, "emp@example.com"),
        (UserRole.REVIEWER, "rev@example.com"),
        (UserRole.MANAGER, "mgr@example.com"),
        (UserRole.ADMINISTRATOR, "adm@example.com"),
    ]:
        headers = await _register_and_login(client, role.value.title(), email)
        await _set_role(db_session, email, role)
        for path in [
            "/api/v1/knowledge/summary",
            "/api/v1/knowledge/documents",
            "/api/v1/knowledge/graph",
            "/api/v1/knowledge/decisions",
        ]:
            response = await client.get(path, headers=headers)
            assert response.status_code == 200, (role, path, response.text)


@pytest.mark.asyncio
async def test_summary_counts(client, db_session, tmp_path):
    await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get("/api/v1/knowledge/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] == 3
    assert data["decision_documents"] == 1
    assert data["teams_contributed"] == 2
    assert data["recently_added"] == 1


@pytest.mark.asyncio
async def test_summary_empty_db(client):
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get("/api/v1/knowledge/summary", headers=headers)
    assert response.status_code == 200
    assert response.json() == {
        "total_documents": 0,
        "decision_documents": 0,
        "teams_contributed": 0,
        "recently_added": 0,
    }


@pytest.mark.asyncio
async def test_documents_list_defaults(client, db_session, tmp_path):
    data = await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get("/api/v1/knowledge/documents", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    assert body["file_types"] == ["docx", "pdf"]
    assert body["tags"] == ["AI", "Architecture", "Database", "Evaluation", "Methodology", "Research"]

    first = body["items"][0]  # latest = created_at desc -> doc1 (1 day ago)
    assert first["id"] == str(data["doc1"].id)
    assert first["title"] == "AI Model Evaluation Report.pdf"
    assert first["team_name"] == "AI & Machine Learning"
    assert first["uploader_name"] == "Rahul Sharma"
    assert first["uploader_email"] == "rahul@example.com"
    assert first["file_type"] == "pdf"
    assert first["tags"] == ["AI", "Evaluation", "Research"]
    assert first["decision_title"] == "AI Model Evaluation Decision"
    assert first["decision_id"] == str(data["decision"].id)
    assert first["has_content"] is True
    assert "content_path" not in first


@pytest.mark.asyncio
async def test_documents_pagination(client, db_session, tmp_path):
    await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    page1 = await client.get(
        "/api/v1/knowledge/documents?limit=2&offset=0", headers=headers
    )
    page2 = await client.get(
        "/api/v1/knowledge/documents?limit=2&offset=2", headers=headers
    )
    assert page1.status_code == 200
    assert page2.status_code == 200
    assert page1.json()["total"] == 3
    assert len(page1.json()["items"]) == 2
    assert len(page2.json()["items"]) == 1
    ids1 = {item["id"] for item in page1.json()["items"]}
    ids2 = {item["id"] for item in page2.json()["items"]}
    assert ids1.isdisjoint(ids2)


@pytest.mark.asyncio
async def test_documents_search(client, db_session, tmp_path):
    data = await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")

    by_title = await client.get(
        "/api/v1/knowledge/documents?query=methodology", headers=headers
    )
    assert [d["id"] for d in by_title.json()["items"]] == [str(data["doc3"].id)]

    by_uploader = await client.get(
        "/api/v1/knowledge/documents?query=rahul", headers=headers
    )
    assert len(by_uploader.json()["items"]) == 2  # docs uploaded by Rahul

    by_team = await client.get(
        "/api/v1/knowledge/documents?query=research+%26+innovation", headers=headers
    )
    assert [d["id"] for d in by_team.json()["items"]] == [str(data["doc3"].id)]

    by_tag = await client.get(
        "/api/v1/knowledge/documents?query=evaluation", headers=headers
    )
    assert [d["id"] for d in by_tag.json()["items"]] == [str(data["doc1"].id)]

    none = await client.get(
        "/api/v1/knowledge/documents?query=zzzzz", headers=headers
    )
    assert none.json()["total"] == 0
    assert none.json()["items"] == []


@pytest.mark.asyncio
async def test_documents_filters(client, db_session, tmp_path):
    data = await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")

    by_team = await client.get(
        f"/api/v1/knowledge/documents?team_id={data['team1'].id}", headers=headers
    )
    assert by_team.json()["total"] == 2

    by_type = await client.get(
        "/api/v1/knowledge/documents?file_type=pdf", headers=headers
    )
    assert by_type.json()["total"] == 2
    assert all(d["file_type"] == "pdf" for d in by_type.json()["items"])

    by_tag = await client.get(
        "/api/v1/knowledge/documents?tag=Research", headers=headers
    )
    assert [d["id"] for d in by_tag.json()["items"]] == [
        str(data["doc1"].id),
        str(data["doc3"].id),
    ]


@pytest.mark.asyncio
async def test_documents_sort(client, db_session, tmp_path):
    await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")

    latest = await client.get(
        "/api/v1/knowledge/documents?sort=latest", headers=headers
    )
    assert [d["title"] for d in latest.json()["items"]] == [
        "AI Model Evaluation Report.pdf",  # 1 day ago
        "Database Architecture.docx",  # 10 days ago
        "Research Methodology.pdf",  # 20 days ago
    ]

    oldest = await client.get(
        "/api/v1/knowledge/documents?sort=oldest", headers=headers
    )
    assert [d["title"] for d in oldest.json()["items"]] == list(
        reversed([d["title"] for d in latest.json()["items"]])
    )

    name_asc = await client.get(
        "/api/v1/knowledge/documents?sort=name_asc", headers=headers
    )
    assert [d["title"] for d in name_asc.json()["items"]] == sorted(
        ["AI Model Evaluation Report.pdf", "Database Architecture.docx", "Research Methodology.pdf"],
        key=str.lower,
    )

    name_desc = await client.get(
        "/api/v1/knowledge/documents?sort=name_desc", headers=headers
    )
    assert [d["title"] for d in name_desc.json()["items"]] == list(
        reversed([d["title"] for d in name_asc.json()["items"]])
    )


@pytest.mark.asyncio
async def test_invalid_sort_rejected(client, db_session, tmp_path):
    await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get(
        "/api/v1/knowledge/documents?sort=bogus", headers=headers
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_document_detail(client, db_session, tmp_path):
    data = await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get(
        f"/api/v1/knowledge/documents/{data['doc1'].id}", headers=headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "AI Model Evaluation Report.pdf"
    assert body["team_name"] == "AI & Machine Learning"
    assert body["uploader_name"] == "Rahul Sharma"
    assert body["file_size_bytes"] > 0
    assert body["decision_title"] == "AI Model Evaluation Decision"
    assert body["has_content"] is True
    assert "content_path" not in body

    missing = await client.get(
        f"/api/v1/knowledge/documents/{uuid.uuid4()}", headers=headers
    )
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_document_download(client, db_session, tmp_path):
    data = await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")

    response = await client.get(
        f"/api/v1/knowledge/documents/{data['doc1'].id}/download", headers=headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert response.text == "demo content for the report"

    no_content = await client.get(
        f"/api/v1/knowledge/documents/{data['doc2'].id}/download", headers=headers
    )
    assert no_content.status_code == 404


@pytest.mark.asyncio
async def test_repository_decisions(client, db_session, tmp_path):
    await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get("/api/v1/knowledge/decisions", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["title"] == "AI Model Evaluation Decision"
    assert item["team_name"] == "AI & Machine Learning"
    assert item["created_by_name"] == "Rahul Sharma"
    assert item["status"] == "draft"
    assert item["document_count"] == 1

    searched = await client.get(
        "/api/v1/knowledge/decisions?query=evaluation", headers=headers
    )
    assert searched.json()["total"] == 1
    missed = await client.get(
        "/api/v1/knowledge/decisions?query=zzz", headers=headers
    )
    assert missed.json()["total"] == 0

    paginated = await client.get(
        "/api/v1/knowledge/decisions?limit=1&offset=0", headers=headers
    )
    assert len(paginated.json()["items"]) == 1
    assert paginated.json()["total"] == 1
    paginated2 = await client.get(
        "/api/v1/knowledge/decisions?limit=1&offset=1", headers=headers
    )
    assert len(paginated2.json()["items"]) == 0


@pytest.mark.asyncio
async def test_knowledge_graph_real_relationships(client, db_session, tmp_path):
    data = await _seed_basics(db_session, tmp_path)
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get("/api/v1/knowledge/graph", headers=headers)
    assert response.status_code == 200
    body = response.json()

    node_ids = {node["id"] for node in body["nodes"]}
    types = {node["type"] for node in body["nodes"]}
    assert types == {"team", "person", "document", "decision"}

    # Lonely User has no team/doc/decision and must NOT appear as a node.
    assert str(data["user3"].id) not in node_ids

    edges = {(e["source"], e["target"], e["relationship"]) for e in body["edges"]}
    assert (str(data["team1"].id), str(data["user1"].id), "member") in edges
    assert (str(data["user1"].id), str(data["doc1"].id), "uploaded") in edges
    assert (str(data["doc1"].id), str(data["team1"].id), "belongs to") in edges
    assert (str(data["doc1"].id), str(data["decision"].id), "attached to") in edges
    assert (str(data["user1"].id), str(data["decision"].id), "created by") in edges
    assert (str(data["team1"].id), str(data["decision"].id), "associated") in edges

    # Every edge must connect real nodes (no dangling references).
    edge_ids = {e["source"] for e in body["edges"]} | {e["target"] for e in body["edges"]}
    assert edge_ids <= node_ids


@pytest.mark.asyncio
async def test_knowledge_graph_empty(client):
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.get("/api/v1/knowledge/graph", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"nodes": [], "edges": []}


@pytest.mark.asyncio
async def test_knowledge_repository_is_read_only(client):
    headers = await _register_and_login(client, "Employee", "emp@example.com")
    response = await client.post(
        "/api/v1/knowledge/documents",
        json={"title": "Nope", "description": "should not be creatable"},
        headers=headers,
    )
    assert response.status_code == 405
    response = await client.post("/api/v1/knowledge/graph", json={}, headers=headers)
    assert response.status_code == 405
    response = await client.delete(
        f"/api/v1/knowledge/documents/{uuid.uuid4()}", headers=headers
    )
    assert response.status_code == 405