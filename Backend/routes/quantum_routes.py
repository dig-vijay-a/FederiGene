from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.quantum_privacy import quantum_shield

router = APIRouter(prefix="/api/quantum", tags=["Quantum-Resistant Privacy"])

class KeyRequest(BaseModel):
    algorithm: str = "CRYSTALS-Kyber"

class EncryptionRequest(BaseModel):
    data_size_kb: int

@router.post("/keys/generate")
async def generate_pqc_key():
    """Generates a NIST-standard Post-Quantum Cryptographic (PQC) key pair."""
    return quantum_shield.generate_pqc_keypair()

@router.post("/encrypt/lattice")
async def lattice_encryption(req: EncryptionRequest):
    """Simulates Lattice-based Homomorphic Encryption (LHE) for quantum-secure aggregation."""
    return quantum_shield.simulate_lattice_encryption(req.data_size_kb)

@router.get("/status")
async def get_quantum_status():
    """Retrieves the platform's quantum-readiness and data longevity scores."""
    return quantum_shield.get_longevity_status()
