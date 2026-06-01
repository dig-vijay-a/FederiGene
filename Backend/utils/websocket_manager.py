from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    """
    Manages active WebSocket connections for real-time training monitoring.
    Organizes connections into rooms by job_id.
    """
    def __init__(self):
        # job_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)

    def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            if websocket in self.active_connections[job_id]:
                self.active_connections[job_id].remove(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]

    async def broadcast_to_job(self, job_id: str, message: dict):
        """Sends a JSON message to all subscribers of a specific job_id."""
        if job_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            # Cleanup dead connections
            for conn in disconnected:
                self.disconnect(conn, job_id)

# Global Instance
ws_manager = ConnectionManager()
