import io
import os

import pytest

pytestmark = pytest.mark.asyncio


async def _register_and_login(client, email="uploader@example.com", name="Uploader"):
    await client.post(
        "/api/v1/auth/register", json={"full_name": name, "email": email, "password": "password123"}
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return resp.json()


def _auth_headers(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _create_decision(client, tokens):
    resp = await client.post(
        "/api/v1/decisions",
        json={"title": "Decision with files", "problem_statement": "Needs supporting docs"},
        headers=_auth_headers(tokens),
    )
    return resp.json()["id"]


async def test_upload_and_download_attachment(client, tmp_path, monkeypatch):
    # Redirect storage to a temp directory so tests don't write into the real project folder
    from app.core import config as config_module
    monkeypatch.setattr(config_module.settings, "STORAGE_DIR", str(tmp_path))

    tokens = await _register_and_login(client)
    decision_id = await _create_decision(client, tokens)

    file_content = b"quarter one budget numbers"
    files = {"file": ("budget.csv", io.BytesIO(file_content), "text/csv")}

    upload_resp = await client.post(
        f"/api/v1/decisions/{decision_id}/attachments", files=files, headers=_auth_headers(tokens)
    )
    assert upload_resp.status_code == 201
    body = upload_resp.json()
    assert body["filename"] == "budget.csv"
    assert body["size_bytes"] == len(file_content)

    download_resp = await client.get(
        f"/api/v1/decisions/{decision_id}/attachments/{body['id']}/download",
        headers=_auth_headers(tokens),
    )
    assert download_resp.status_code == 200
    assert download_resp.content == file_content


async def test_upload_rejects_disallowed_file_type(client, tmp_path, monkeypatch):
    from app.core import config as config_module
    monkeypatch.setattr(config_module.settings, "STORAGE_DIR", str(tmp_path))

    tokens = await _register_and_login(client)
    decision_id = await _create_decision(client, tokens)

    files = {"file": ("script.exe", io.BytesIO(b"not a real exe"), "application/x-msdownload")}
    resp = await client.post(
        f"/api/v1/decisions/{decision_id}/attachments", files=files, headers=_auth_headers(tokens)
    )
    assert resp.status_code == 415


async def test_delete_attachment_removes_file_from_disk(client, tmp_path, monkeypatch):
    from app.core import config as config_module
    monkeypatch.setattr(config_module.settings, "STORAGE_DIR", str(tmp_path))

    tokens = await _register_and_login(client)
    decision_id = await _create_decision(client, tokens)

    files = {"file": ("notes.txt", io.BytesIO(b"some notes"), "text/plain")}
    upload_resp = await client.post(
        f"/api/v1/decisions/{decision_id}/attachments", files=files, headers=_auth_headers(tokens)
    )
    attachment = upload_resp.json()
    stored_files_before = list(tmp_path.rglob("*.txt"))
    assert len(stored_files_before) == 1

    delete_resp = await client.delete(
        f"/api/v1/decisions/{decision_id}/attachments/{attachment['id']}",
        headers=_auth_headers(tokens),
    )
    assert delete_resp.status_code == 204

    stored_files_after = list(tmp_path.rglob("*.txt"))
    assert len(stored_files_after) == 0


async def test_upload_requires_decision_to_be_editable(client, tmp_path, monkeypatch):
    from app.core import config as config_module
    monkeypatch.setattr(config_module.settings, "STORAGE_DIR", str(tmp_path))

    tokens = await _register_and_login(client)
    decision_id = await _create_decision(client, tokens)
    await client.post(f"/api/v1/decisions/{decision_id}/submit", headers=_auth_headers(tokens))

    files = {"file": ("late.txt", io.BytesIO(b"too late"), "text/plain")}
    resp = await client.post(
        f"/api/v1/decisions/{decision_id}/attachments", files=files, headers=_auth_headers(tokens)
    )
    assert resp.status_code == 409
