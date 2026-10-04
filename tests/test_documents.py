import io
import os

from tests.conftest import login, auth_headers


def create_decision(client, token):
    r = client.post("/decisions", headers=auth_headers(token), json={
        "title": "Decision for documents",
        "problem_statement": "Problem",
        "category": "Process",
    })
    return r.json()


def test_upload_list_download_delete_document(client, employee, tmp_path, monkeypatch):
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    from app.core.config import settings
    settings.upload_dir = str(tmp_path / "uploads")

    token = login(client, employee.email)
    decision = create_decision(client, token)

    file_content = b"%PDF-1.4 fake pdf content"
    r = client.post(
        f"/decisions/{decision['id']}/documents",
        headers=auth_headers(token),
        files={"file": ("spec.pdf", io.BytesIO(file_content), "application/pdf")},
    )
    assert r.status_code == 201, r.text
    doc = r.json()
    assert doc["filename"] == "spec.pdf"
    assert doc["file_size"] == len(file_content)

    r = client.get(f"/decisions/{decision['id']}/documents", headers=auth_headers(token))
    assert r.status_code == 200
    assert len(r.json()) == 1

    r = client.get(f"/documents/{doc['id']}/download", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.content == file_content

    r = client.delete(f"/documents/{doc['id']}", headers=auth_headers(token))
    assert r.status_code == 200

    r = client.get(f"/decisions/{decision['id']}/documents", headers=auth_headers(token))
    assert len(r.json()) == 0


def test_rejects_disallowed_file_type(client, employee, tmp_path):
    from app.core.config import settings
    settings.upload_dir = str(tmp_path / "uploads")

    token = login(client, employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/documents",
        headers=auth_headers(token),
        files={"file": ("virus.exe", io.BytesIO(b"MZ fake exe"), "application/octet-stream")},
    )
    assert r.status_code == 400


def test_other_employee_cannot_upload_or_see_documents(client, employee, other_employee, tmp_path):
    from app.core.config import settings
    settings.upload_dir = str(tmp_path / "uploads")

    token = login(client, employee.email)
    other_token = login(client, other_employee.email)
    decision = create_decision(client, token)

    r = client.post(
        f"/decisions/{decision['id']}/documents",
        headers=auth_headers(other_token),
        files={"file": ("spec.pdf", io.BytesIO(b"content"), "application/pdf")},
    )
    assert r.status_code == 403

    r = client.get(f"/decisions/{decision['id']}/documents", headers=auth_headers(other_token))
    assert r.status_code == 403


def test_document_appears_in_replay_timeline(client, employee, tmp_path):
    from app.core.config import settings
    settings.upload_dir = str(tmp_path / "uploads")

    token = login(client, employee.email)
    decision = create_decision(client, token)

    client.post(
        f"/decisions/{decision['id']}/documents",
        headers=auth_headers(token),
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
    )

    r = client.get(f"/decisions/{decision['id']}/replay", headers=auth_headers(token))
    types_seen = [e["type"] for e in r.json()["timeline"]]
    assert "DOCUMENT_UPLOADED" in types_seen
