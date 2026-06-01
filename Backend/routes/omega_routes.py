from fastapi import APIRouter
from pydantic import BaseModel
from services.omega_engine import omega_engine

router = APIRouter(prefix="/api/omega", tags=["The Omega Project (Universal Biosphere)"])

class RepairRequest(BaseModel):
    genomic_locus: str

class BioKeyRequest(BaseModel):
    sample_hash: str

@router.get("/biosphere")
async def get_biosphere_state():
    """Retrieves the global status of the digitized human twin biosphere."""
    return omega_engine.get_biosphere_metrics()

@router.post("/repair/initiate")
async def initiate_repair(req: RepairRequest):
    """Triggers an autonomous genomic repair cycle."""
    return omega_engine.initiate_genomic_repair(req.genomic_locus)

@router.get("/repairs/active")
async def get_active_repairs():
    """Retrieves real-time progress of active autonomous genomic repairs."""
    return {"repairs": omega_engine.get_active_repairs()}

@router.post("/encryption/generate-key")
async def generate_bio_key(req: BioKeyRequest):
    """Generates a DNA-native privacy key for secure biological data handling."""
    return omega_engine.generate_bio_encryption_key(req.sample_hash)
