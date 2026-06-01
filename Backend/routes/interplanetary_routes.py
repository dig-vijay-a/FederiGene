from fastapi import APIRouter
from pydantic import BaseModel
from services.interplanetary_ledger import interplanetary_ledger

router = APIRouter(prefix="/api/interplanetary", tags=["Interplanetary Medical Ledger"])

class SyncRequest(BaseModel):
    model_id: str

class BioIDRequest(BaseModel):
    name: str
    home_world: str = "Earth"

@router.get("/nodes")
async def get_space_nodes():
    """Retrieves current status and latency for extra-terrestrial federated nodes."""
    return {"nodes": interplanetary_ledger.get_space_nodes_status()}

@router.post("/sync")
async def sync_weights(req: SyncRequest):
    """Beams a compressed model weight packet to deep space colonies (Mars/Lunar)."""
    return interplanetary_ledger.sync_weights_to_mars(req.model_id)

@router.post("/bio-id/register")
async def register_bio_id(req: BioIDRequest):
    """Generates a universal Bio-ID for interplanetary travelers."""
    return interplanetary_ledger.register_interplanetary_bio_id(req.name, req.home_world)
