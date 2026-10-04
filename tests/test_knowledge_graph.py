from tests.conftest import login, auth_headers, make_user


def create_decision(client, token, tags="alpha,beta"):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Graph verification decision",
        "problem_statement": "Problem",
        "category": "Process",
        "tags": tags,
    })
    return r.json()


def test_graph_contains_decision_and_state_nodes(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}/knowledge-graph", headers=auth_headers(token))
    assert r.status_code == 200, r.text
    body = r.json()

    node_types = {n["type"] for n in body["nodes"]}
    assert "decision" in node_types
    assert "state" in node_types

    decision_nodes = [n for n in body["nodes"] if n["type"] == "decision"]
    assert decision_nodes[0]["label"] == "Graph verification decision"


def test_graph_includes_creator_as_person(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}/knowledge-graph", headers=auth_headers(token))
    body = r.json()

    person_nodes = [n for n in body["nodes"] if n["type"] == "person"]
    assert any(p["label"] == employee.full_name for p in person_nodes)

    creator_edges = [e for e in body["edges"] if e["relation"] == "created by"]
    assert len(creator_edges) == 1


def test_graph_includes_topics_from_tags(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token, tags="urgent, budget")

    r = client.get(f"/decisions/{decision['id']}/knowledge-graph", headers=auth_headers(token))
    body = r.json()

    topic_labels = {n["label"] for n in body["nodes"] if n["type"] == "topic"}
    assert "urgent" in topic_labels
    assert "budget" in topic_labels


def test_graph_includes_reviewer_and_document(client, employee, manager, reviewer, tmp_path):
    from app.core.config import settings
    settings.upload_dir = str(tmp_path / "uploads")

    emp_token = login(client, employee.email)
    mgr_token = login(client, manager.email)

    decision = create_decision(client, emp_token)

    import io
    client.post(
        f"/decisions/{decision['id']}/documents",
        headers=auth_headers(emp_token),
        files={"file": ("plan.pdf", io.BytesIO(b"content"), "application/pdf")},
    )

    client.post(
        "/approvals",
        headers=auth_headers(mgr_token),
        json={"decision_id": decision["id"], "reviewer_id": reviewer.id, "approval_level": 1},
    )

    r = client.get(f"/decisions/{decision['id']}/knowledge-graph", headers=auth_headers(emp_token))
    body = r.json()

    doc_nodes = [n for n in body["nodes"] if n["type"] == "document"]
    assert any(n["label"] == "plan.pdf" for n in doc_nodes)

    person_nodes = [n for n in body["nodes"] if n["type"] == "person"]
    assert any(p["label"] == reviewer.full_name for p in person_nodes)


def test_graph_access_denied_for_unauthorized_user(client, employee, other_employee):
    token = login(client, employee.email)
    other_token = login(client, other_employee.email)
    decision = create_decision(client, token)

    r = client.get(f"/decisions/{decision['id']}/knowledge-graph", headers=auth_headers(other_token))
    assert r.status_code == 403
