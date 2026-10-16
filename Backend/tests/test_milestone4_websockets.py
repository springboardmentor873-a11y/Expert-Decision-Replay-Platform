import pytest
from security.jwt import create_access_token


def test_websocket_connection_and_messaging(client, auth_headers):
    # 1. Create access token for user
    token = create_access_token({"sub": "admin@edrp-test.com"})

    # 2. Connect via WebSocket
    with client.websocket_connect(f"/notifications/ws?token={token}") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_json()
        assert data == {"type": "pong"}


def test_websocket_unauthorized_rejection(client):
    with pytest.raises(Exception):
        with client.websocket_connect("/notifications/ws?token=invalid_token"):
            pass
