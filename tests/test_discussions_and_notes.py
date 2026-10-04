from tests.conftest import login, auth_headers


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision for discussion",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_discussion_thread_and_reply(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/discussion-threads",
        headers=auth_headers(token),
        json={"title": "Kickoff", "content": "Let's talk"},
    )
    assert r.status_code == 201
    thread_id = r.json()["id"]

    r = client.post(
        f"/discussion-threads/{thread_id}/replies",
        headers=auth_headers(token),
        json={"content": "Good idea"},
    )
    assert r.status_code == 201

    r = client.get(
        f"/discussion-threads/{thread_id}/replies",
        headers=auth_headers(token),
    )
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_comments_crud(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/comments",
        headers=auth_headers(token),
        json={"content": "First comment"},
    )
    assert r.status_code == 201
    comment_id = r.json()["id"]

    r = client.put(
        f"/decisions/comments/{comment_id}",
        headers=auth_headers(token),
        json={"content": "Edited comment"},
    )
    assert r.status_code == 200
    assert r.json()["content"] == "Edited comment"

    r = client.delete(
        f"/decisions/comments/{comment_id}",
        headers=auth_headers(token),
    )
    assert r.status_code == 200


def test_meeting_notes(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/meeting-notes",
        headers=auth_headers(token),
        json={"content": "Discussed timeline"},
    )
    assert r.status_code == 201

    r = client.get(
        f"/decisions/{decision['id']}/meeting-notes",
        headers=auth_headers(token),
    )
    assert len(r.json()) == 1


def test_rationale_create_and_update(client, employee):
    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/rationale",
        headers=auth_headers(token),
        json={"content": "Initial rationale"},
    )
    assert r.status_code == 201

    r = client.post(
        f"/decisions/{decision['id']}/rationale",
        headers=auth_headers(token),
        json={"content": "Duplicate attempt"},
    )
    assert r.status_code == 400

    r = client.put(
        f"/decisions/{decision['id']}/rationale",
        headers=auth_headers(token),
        json={"content": "Updated rationale"},
    )
    assert r.status_code == 200
    assert r.json()["content"] == "Updated rationale"
