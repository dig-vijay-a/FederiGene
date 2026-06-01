from fastapi import APIRouter
from pydantic import BaseModel
from services.neural_engine import neural_service

router = APIRouter(prefix="/api/neural", tags=["Neural-AI Co-Evolution"])

class ConsensusRequest(BaseModel):
    case_id: str

@router.get("/metrics")
async def get_neural_metrics():
    """Retrieves real-time synaptic bandwidth and neuro-augmented clinician counts."""
    return neural_service.get_neural_metrics()

@router.post("/consensus/trigger")
async def trigger_consensus(req: ConsensusRequest):
    """Triggers a real-time collective intelligence consensus round for a specific case."""
    return neural_service.trigger_consensus_round(req.case_id)

@router.get("/consensus/active")
async def get_active_consensus():
    """Retrieves all active collective clinical intelligence events."""
    return {"events": neural_service.get_active_consensus()}

@router.get("/telemetry/{clinician_id}")
async def get_bci_telemetry(clinician_id: str):
    """Simulates real-time BCI telemetry for a specific clinician."""
    return neural_service.stream_bci_telemetry(clinician_id)
