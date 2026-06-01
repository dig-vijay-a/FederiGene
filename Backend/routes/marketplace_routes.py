from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database.config import get_db
from pydantic import BaseModel
from services.marketplace_engine import marketplace_engine
from routes.user_routes import get_current_user
from models.auth_models import User
from models.platform_models import Wallet, FedcoinTransaction

router = APIRouter(prefix="/api/marketplace", tags=["Commercial Ecosystem & Marketplace"])

class SubscriptionRequest(BaseModel):
    entity_id: str
    model_id: int
    payment_amount: float # In FedCoin

class PublishRequest(BaseModel):
    name: str
    architecture: str
    specialty: str
    description: str

@router.post("/models/{model_id}/publish")
async def publish_model(model_id: int, req: PublishRequest, db: Session = Depends(get_db)):
    """
    Publishes a local model version to the global commercial marketplace.
    """
    from models.platform_models import ModelVersion
    import json
    
    model = db.query(ModelVersion).filter(ModelVersion.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    model.is_published = True
    model.specialty = req.specialty
    
    meta = json.loads(model.marketplace_metadata) if model.marketplace_metadata else {}
    meta["name"] = req.name
    meta["architecture"] = req.architecture
    meta["description"] = req.description
    model.marketplace_metadata = json.dumps(meta)
    
    db.commit()
    return {"message": "Model published successfully"}

@router.get("/catalog")
async def get_marketplace_catalog(db: Session = Depends(get_db)):
    """
    Returns the list of available global models that can be licensed or accessed via API.
    """
    return {"models": marketplace_engine.get_marketplace_catalog(db)}

@router.get("/models")
async def get_marketplace_discovery(specialty: str = None, min_accuracy: float = 0, db: Session = Depends(get_db)):
    """
    Returns a filtered list of models for the discovery marketplace.
    Used by MarketplaceHome.jsx.
    """
    return marketplace_engine.get_marketplace_models(db, specialty, min_accuracy)

@router.get("/my-wallet")
async def get_my_wallet(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the full wallet state including transactions for the currently logged-in user.
    If the user is an org admin, it uses the org wallet. Otherwise, the personal wallet.
    """
    # Determine the entity ID
    if user.role in ["platform_admin", "hospital_admin"] and hasattr(user, "memberships") and user.memberships:
        primary_org = next((m.org_id for m in user.memberships if m.is_primary), None)
        if primary_org:
            entity_id = f"ORG_{primary_org}"
        else:
            entity_id = f"USER_{user.id}"
    else:
        entity_id = f"USER_{user.id}"
        
    wallet = db.query(Wallet).filter(Wallet.owner_id == entity_id).first()
    if not wallet:
        return {"balance_fedcoin": 0.0, "total_earned": 0.0, "transactions": []}
        
    txns = db.query(FedcoinTransaction).filter(FedcoinTransaction.wallet_id == wallet.id).order_by(FedcoinTransaction.timestamp.desc()).all()
    
    return {
        "balance_fedcoin": wallet.balance_fedcoin,
        "total_earned": wallet.total_earned,
        "transactions": [
            {
                "id": t.id,
                "activity": t.activity,
                "reward_amount": t.reward_amount,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None
            } for t in txns
        ]
    }

@router.get("/wallet/{entity_id}")
async def get_wallet_balance(entity_id: str, db: Session = Depends(get_db)):
    """
    Returns the FedCoin balance and total earnings for a specific organization or researcher.
    """
    return marketplace_engine.get_wallet_balance(db, entity_id)

@router.post("/subscribe")
async def subscribe_to_model(req: SubscriptionRequest, db: Session = Depends(get_db)):
    """
    Purchases API inference credits for a commercial model using FedCoin.
    Triggers automated revenue sharing (Smart Contract simulation) back to original data providers.
    """
    result = marketplace_engine.subscribe_to_model_api(
        db=db,
        entity_id=req.entity_id,
        model_id=req.model_id,
        payment_amount=req.payment_amount
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result
