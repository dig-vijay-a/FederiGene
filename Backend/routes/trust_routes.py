from fastapi import APIRouter, Depends, HTTPException
from services.blockchain_manager import blockchain
from pydantic import BaseModel

router = APIRouter(prefix="/api/trust", tags=["Decentralized Trust & Blockchain"])

class DUARequest(BaseModel):
    dataset_id: int
    consumer_did: str
    provider_did: str
    terms: str

@router.get("/ledger")
async def get_ledger(limit: int = 10):
    """
    Returns the most recent blocks from the immutable trust ledger.
    Used by the Trust Explorer UI.
    """
    return {"network": "FederiGene Trust Network (Polygon Edge)", "blocks": blockchain.get_recent_blocks(limit)}

@router.post("/dua/deploy")
async def deploy_dua_contract(req: DUARequest):
    """
    Deploys a Smart Contract-based Data Usage Agreement (DUA).
    """
    result = blockchain.register_dua(
        dataset_id=req.dataset_id,
        consumer_org_did=req.consumer_did,
        provider_org_did=req.provider_did,
        terms=req.terms
    )
    return {"message": "Smart Contract Deployed", "data": result}

@router.get("/verify/{txn_hash}")
async def verify_transaction(txn_hash: str):
    """
    Cryptographically verifies a transaction (Model Update or DUA) against the ledger.
    """
    result = blockchain.verify_transaction(txn_hash)
    if not result.get("verified"):
        raise HTTPException(status_code=404, detail=result.get("error", "Verification failed"))
    return {"message": "Transaction Verified", "data": result}
