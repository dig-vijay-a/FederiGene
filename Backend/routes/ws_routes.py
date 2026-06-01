from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.websocket_manager import ws_manager

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/training/{job_id}")
async def training_websocket(websocket: WebSocket, job_id: int):
    """
    WebSocket endpoint — clients connect here to receive live FL training updates.
    """
    print(f"📡 [WS] Connection attempt received for Job #{job_id}")
    try:
        await ws_manager.connect(websocket, str(job_id))
        print(f"✅ [WS] Connection accepted and active for Job #{job_id}")
        
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        print(f"🔌 [WS] Connection disconnected for Job #{job_id}")
        ws_manager.disconnect(websocket, str(job_id))
    except Exception as e:
        print(f"❌ [WS] Socket error for Job #{job_id}: {e}")
        try:
            ws_manager.disconnect(websocket, str(job_id))
        except:
            pass
