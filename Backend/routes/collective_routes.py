from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.collective_intelligence import collective_service

router = APIRouter(prefix="/api/collective", tags=["Zero-Latency Collective Intelligence"])

class HoloRequest(BaseModel):
    patient_id: str
    specialist_ids: List[str]

class ConsensusRequest(BaseModel):
    case_id: str
    hypothesis: str

@router.get("/metrics")
async def get_collective_metrics():
    """Retrieves real-time network latency and collective IQ metrics."""
    return collective_service.get_collective_metrics()

@router.post("/hologram/initiate")
async def initiate_hologram(req: HoloRequest):
    """Initiates a real-time holographic clinical consultation."""
    return collective_service.initiate_holographic_consultation(req.patient_id, req.specialist_ids)

@router.get("/hologram/sessions")
async def get_holo_sessions():
    """Retrieves active holographic diagnostic sessions."""
    return {"sessions": collective_service.get_active_sessions()}

@router.post("/consensus/start")
async def start_consensus(req: ConsensusRequest):
    """Triggers a neural-link based consensus round for a clinical case."""
    return collective_service.start_consensus_round(req.case_id, req.hypothesis)

@router.get("/consensus/history")
async def get_consensus_history():
    """Retrieves history and status of neural consensus rounds."""
    return {"rounds": collective_service.get_consensus_history()}
