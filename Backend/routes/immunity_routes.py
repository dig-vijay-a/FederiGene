from fastapi import APIRouter
from pydantic import BaseModel
from services.immunity_firewall import immunity_service

router = APIRouter(prefix="/api/immunity", tags=["Global Immunity Firewall"])

class DiscoveryRequest(BaseModel):
    hub_id: str
    pathogen_name: str

class QuarantineRequest(BaseModel):
    region: str
    reason: str

@router.get("/status")
async def get_firewall_status():
    """Retrieves the real-time status of global biosecurity hubs."""
    return immunity_service.get_firewall_status()

@router.post("/discover")
async def discover_pathogen(req: DiscoveryRequest):
    """Simulates a pathogen discovery event and triggers sequence streaming."""
    return immunity_service.simulate_pathogen_discovery(req.hub_id, req.pathogen_name)

@router.get("/quarantine")
async def get_quarantine_orders():
    """Retrieves active federated quarantine coordination orders."""
    return {"orders": immunity_service.get_quarantine_protocols()}

@router.post("/quarantine/initiate")
async def initiate_quarantine(req: QuarantineRequest):
    """Initiates a federated quarantine order across the network."""
    return immunity_service.initiate_quarantine(req.region, req.reason)
