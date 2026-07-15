import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps active interview session IDs to list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, interview_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(interview_id, []).append(websocket)
        logger.info(f"WebSocket client connected to session: {interview_id}")

    def disconnect(self, interview_id: str, websocket: WebSocket):
        if interview_id in self.active_connections:
            self.active_connections[interview_id].remove(websocket)
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]
            logger.info(f"WebSocket client disconnected from session: {interview_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_session(self, interview_id: str, message: dict):
        if interview_id in self.active_connections:
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to broadcast websocket packet to connection in {interview_id}: {e}")

# Global websocket manager instance
socket_manager = ConnectionManager()

# Background helper task to run interview session timers
async def start_websocket_timer(interview_id: str, total_seconds: int = 1800):
    """
    Simulates a countdown clock in the background, broadcasting remaining times.
    """
    remaining = total_seconds
    while remaining >= 0:
        # Broadcast every 15 seconds to minimize network noise, and every second in the last 10 seconds
        if remaining % 15 == 0 or remaining <= 10:
            await socket_manager.broadcast_to_session(interview_id, {
                "event": "timer_update",
                "remaining_seconds": remaining,
                "display": f"{remaining // 60:02d}:{remaining % 60:02d}"
            })
        await asyncio.sleep(1)
        remaining -= 1
    
    await socket_manager.broadcast_to_session(interview_id, {
        "event": "timer_expire",
        "message": "Time is up!"
    })

async def simulate_ai_activity(interview_id: str, agent_name: str):
    """
    Simulates typing status indicators and progress steps for AI agent generation.
    """
    steps = [
        {"status": "thinking", "message": f"{agent_name} is evaluating context..."},
        {"status": "typing", "message": f"{agent_name} is typing question..."},
        {"status": "ready", "message": "Question is ready!"}
    ]
    
    for step in steps:
        await socket_manager.broadcast_to_session(interview_id, {
            "event": "ai_status",
            "status": step["status"],
            "message": step["message"]
        })
        if step["status"] != "ready":
            await asyncio.sleep(1.5)
