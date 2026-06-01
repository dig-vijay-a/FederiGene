from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from database.config import get_db
from models.auth_models import User
from routes.user_routes import get_current_user
from services.web3_service import web3_service

router = APIRouter(prefix="/api/web3", tags=["Patient Data Sovereignty (Web3)"])

class MintRequest(BaseModel):
    patient_did: str
    data_types: List[str]

class IncentiveRequest(BaseModel):
    nft_id: str
    amount: float
    reason: str

@router.post("/passport/mint")
async def mint_passport(
    req: MintRequest, 
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mints a sovereign Genomic Passport NFT for a patient."""
    return web3_service.mint_genomic_passport(db, user, req.data_types)

@router.get("/passport/{patient_did}")
async def get_passports(
    patient_did: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all data passports owned by a patient identity."""
    # We ignore patient_did and just use the logged-in user for security
    return {"passports": web3_service.get_patient_passports(db, user)}

@router.post("/incentive/distribute")
async def distribute_incentive(
    req: IncentiveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Distributes FedCoin incentives directly to a patient's sovereign wallet."""
    result = web3_service.distribute_d2p_incentive(db, req.nft_id, req.amount, req.reason)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
