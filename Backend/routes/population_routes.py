from fastapi import APIRouter
from services.population_health import population_health

router = APIRouter(prefix="/api/population", tags=["Precision Population Health"])

@router.get("/telemetry")
async def get_global_telemetry():
    """Returns population-level wearable sensor aggregates."""
    return population_health.get_bio_sync_telemetry()

@router.get("/exposome")
async def correlate_exposome_genomics():
    """Correlates environmental factors with genomic datasets."""
    return population_health.correlate_exposome()

@router.get("/outbreaks")
async def get_outbreak_alerts():
    """Retrieves real-time federated outbreak warnings."""
    return {"alerts": population_health.get_outbreak_warnings()}
