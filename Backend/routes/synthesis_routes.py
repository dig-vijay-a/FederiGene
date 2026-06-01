from fastapi import APIRouter
from pydantic import BaseModel
from services.synthesis_engine import synthesis_service

router = APIRouter(prefix="/api/synthesis", tags=["Biogenetic Synthesis & Simulation"])

class SimulationRequest(BaseModel):
    disease_target: str

class TwinRequest(BaseModel):
    patient_ref: str

@router.get("/overview")
async def get_synthesis_overview():
    """Retrieves population-level synthesis metrics and active simulation counts."""
    return synthesis_service.get_simulation_overview()

@router.post("/simulation/start")
async def start_simulation(req: SimulationRequest):
    """Triggers an in-silico disease model simulation for a specific target."""
    return synthesis_service.start_in_silico_model(req.disease_target)

@router.post("/twin/generate")
async def generate_twin(req: TwinRequest):
    """Generates a high-fidelity pediatric digital twin for therapeutic testing."""
    return synthesis_service.generate_pediatric_twin(req.patient_ref)

@router.get("/tasks")
async def get_active_tasks():
    """Retrieves the real-time progress of active synthesis simulations."""
    return {"tasks": synthesis_service.get_active_tasks()}
