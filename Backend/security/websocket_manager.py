import asyncio
from typing import Dict, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
from models.notification import Notification


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, user_id)

    async def broadcast(self, message: dict):
        for user_id, connections in list(self.active_connections.items()):
            for connection in list(connections):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, user_id)


ws_manager = ConnectionManager()


def create_and_notify(db: Session, user_id: int, message: str, entity_type: str = None, entity_id: int = None):
    note = Notification(
        user_id=user_id,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    try:
        payload = {
            "type": "notification",
            "id": note.id,
            "message": note.message,
            "entity_type": note.entity_type,
            "entity_id": note.entity_id,
            "created_at": note.created_at.isoformat() if note.created_at else None,
        }
        loop = asyncio.get_running_loop()
        loop.create_task(ws_manager.send_personal_message(payload, user_id))
    except RuntimeError:
        pass

    return note
