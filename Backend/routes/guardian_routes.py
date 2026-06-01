from fastapi import APIRouter
from pydantic import BaseModel
from services.guardian_engine import guardian_service

router = APIRouter(prefix="/api/guardian", tags=["The Eternal Guardian (Universal Equilibrium)"])

@router.get("/status")
async def get_guardian_status():
    """Retrieves the real-time status of the Eternal Guardian and global equilibrium."""
    return guardian_service.get_guardian_status()

@router.post("/pulse")
async def broadcast_pulse():
    """Initiates a global biological equilibrium pulse."""
    return guardian_service.initiate_equilibrium_pulse()

@router.get("/corrections")
async def get_corrections():
    """Retrieves the history of autonomous corrections performed by the Guardian."""
    return {"corrections": guardian_service.get_autonomous_history()}

@router.post("/repair/stabilize")
async def stabilize_genomic_repair():
    """Stabilizes the genomic-repair to cellular-decay ratio."""
    return guardian_service.simulate_genomic_repair()
