from fastapi import APIRouter
from pydantic import BaseModel
from services.atomic_privacy import atomic_service

router = APIRouter(prefix="/api/atomic", tags=["Atomic-Level Privacy Sovereignty"])

class DNAEncRequest(BaseModel):
    packet_id: str
    sample_hash: str

class ComputeRequest(BaseModel):
    task: str

class SelfDestructRequest(BaseModel):
    data_id: str
    trigger_id: str

@router.get("/metrics")
async def get_atomic_metrics():
    """Retrieves real-time atomic privacy and DNA-vault metrics."""
    return atomic_service.get_privacy_metrics()

@router.post("/encrypt/dna")
async def encrypt_dna(req: DNAEncRequest):
    """Embeds an encryption key into a synthetic DNA lattice."""
    return atomic_service.encrypt_to_dna(req.packet_id, req.sample_hash)

@router.post("/compute/molecular")
async def initiate_compute(req: ComputeRequest):
    """Starts an atomic-level privacy-preserving computation."""
    return atomic_service.initiate_molecular_computation(req.task)

@router.get("/compute/active")
async def get_active_tasks():
    """Retrieves status of active molecular computations."""
    return {"tasks": atomic_service.get_active_tasks()}

@router.post("/deploy/self-destruct")
async def deploy_packet(req: SelfDestructRequest):
    """Deploys a self-destructing data packet with biological triggers."""
    return atomic_service.deploy_self_destruct_packet(req.data_id, req.trigger_id)
