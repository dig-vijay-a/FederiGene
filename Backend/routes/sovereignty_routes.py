from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.sovereignty_engine import sovereignty_engine

router = APIRouter(prefix="/api/sovereignty", tags=["Global AI Sovereignty"])

class VoteRequest(BaseModel):
    proposal_id: str
    node_id: str
    vote: str # "for" or "against"

class ResidencyRequest(BaseModel):
    source_node: str
    target_node: str
    payload_type: str # "raw_weights", "patient_embeddings", "dp_noised", "zkp_attestation"

@router.get("/proposals")
async def get_active_proposals():
    """
    Retrieves all active DAO-style governance proposals for model merges and network security.
    """
    return {"proposals": sovereignty_engine.get_proposals()}

@router.post("/vote")
async def cast_governance_vote(req: VoteRequest):
    """
    Casts a cryptographic vote on a network proposal.
    """
    result = sovereignty_engine.cast_vote(
        proposal_id=req.proposal_id,
        node_id=req.node_id,
        vote=req.vote
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/check-residency")
async def check_data_transfer_legality(req: ResidencyRequest):
    """
    Evaluates if a cross-border data transfer violates international data residency laws (e.g. GDPR).
    Used before any weights or embeddings are transmitted across the federated network.
    """
    result = sovereignty_engine.check_residency_compliance(
        source_node=req.source_node,
        target_node=req.target_node,
        payload_type=req.payload_type
    )
    
    if result.get("action") == "BLOCKED":
        # We return a 403 Forbidden because it's an illegal transfer action
        raise HTTPException(status_code=403, detail=result)
        
    return result
