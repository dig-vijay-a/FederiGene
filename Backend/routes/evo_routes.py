from fastapi import APIRouter
from pydantic import BaseModel
from services.evo_engine import evo_service

router = APIRouter(prefix="/api/evolution", tags=["Evolutionary Genomic Steering"])

class ForecastRequest(BaseModel):
    strain_id: str

class VaccineRequest(BaseModel):
    forecast_id: str

@router.get("/metrics")
async def get_evo_metrics():
    """Retrieves real-time viral monitoring and evolutionary risk metrics."""
    return evo_service.get_evolutionary_metrics()

@router.post("/forecast")
async def forecast_mutation(req: ForecastRequest):
    """Triggers a predictive simulation of potential viral mutations."""
    return evo_service.forecast_mutation(req.strain_id)

@router.get("/inventory")
async def get_vaccine_inventory():
    """Retrieves the inventory of pre-emptive vaccine blueprints."""
    return {"inventory": evo_service.get_preemptive_inventory()}

@router.post("/vaccine/generate")
async def generate_preemptive_vaccine(req: VaccineRequest):
    """Generates a pre-emptive vaccine sequence for a predicted future variant."""
    return evo_service.generate_preemptive_vaccine(req.forecast_id)
