from fastapi import APIRouter
from pydantic import BaseModel
from services.singularity_engine import singularity_engine

router = APIRouter(prefix="/api/singularity", tags=["Universal Medical Intelligence"])

class DiscoveryRequest(BaseModel):
    target: str

@router.get("/metrics")
async def get_singularity_metrics():
    """Retrieves real-time synaptic density and evolution metrics of the global model."""
    return singularity_engine.get_singularity_metrics()

@router.post("/evolve")
async def trigger_evolution():
    """Triggers an autonomous self-optimization round for the global weights."""
    return singularity_engine.trigger_self_evolution()

@router.get("/discovery")
async def get_discovery_pipelines():
    """Returns active autonomous drug discovery jobs."""
    return {"pipelines": singularity_engine.get_discovery_pipeline()}

@router.post("/discovery/propose")
async def propose_discovery(req: DiscoveryRequest):
    """Commands the singularity to identify and screen a new therapeutic target."""
    return singularity_engine.propose_new_discovery(req.target)
