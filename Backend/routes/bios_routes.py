from fastapi import APIRouter
from pydantic import BaseModel
from services.bios_engine import bios_service

router = APIRouter(prefix="/api/bios", tags=["Synthetic Biological OS"])

class SynthesisRequest(BaseModel):
    foundry_id: str
    protein_blueprint: str

@router.get("/status")
async def get_bios_status():
    """Retrieves the status of the Synthetic Bio-OS and connected foundries."""
    return bios_service.get_os_status()

@router.get("/circuits")
async def get_active_circuits():
    """Retrieves real-time status and error rates for active biological circuits."""
    return {"circuits": bios_service.get_active_circuits()}

@router.get("/debug/{circuit_id}")
async def debug_circuit(circuit_id: str):
    """Executes a real-time trace/debug of a specific biological logic gate."""
    return bios_service.debug_circuit(circuit_id)

@router.post("/synthesis/start")
async def start_synthesis(req: SynthesisRequest):
    """Initiates molecular synthesis and creates a permanent audit trail."""
    return bios_service.start_protein_synthesis(req.foundry_id, req.protein_blueprint)

@router.get("/audit")
async def get_molecular_audit():
    """Retrieves the permanent molecular audit trail for protein synthesis."""
    return {"audit_trail": bios_service.get_audit_trail()}
