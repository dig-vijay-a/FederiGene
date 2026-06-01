from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from models.platform_models import ModelVersion, Wallet, MarketplaceSubscription, RevenueRecord
import json

class MarketplaceService:
    """
    Handles the Commercial Ecosystem & Marketplace for FederiGene.
    Now backed by a persistent SQL database.
    """
    def __init__(self):
        # We no longer need in-memory storage for listed_models or wallets
        pass
        
    def get_marketplace_catalog(self, db: Session) -> List[Dict]:
        """Returns models listed in the commercial catalog."""
        models = db.query(ModelVersion).filter(ModelVersion.is_published == True).all()
        return [self._format_model(m) for m in models]

    def get_marketplace_models(self, db: Session, specialty: str = None, min_accuracy: float = 0) -> List[Dict]:
        """Returns filtered models for the discovery marketplace."""
        query = db.query(ModelVersion).filter(ModelVersion.is_published == True)
        
        if specialty:
            query = query.filter(ModelVersion.specialty.ilike(specialty))
            
        if min_accuracy > 0:
            query = query.filter(ModelVersion.accuracy >= min_accuracy)
            
        models = query.all()
        return [self._format_model(m) for m in models]

    def get_wallet_balance(self, db: Session, entity_id: str) -> Dict[str, Any]:
        wallet = db.query(Wallet).filter(Wallet.owner_id == entity_id).first()
        if not wallet:
            # Auto-create wallet for new entities with a welcome balance
            wallet = Wallet(owner_id=entity_id, balance_fedcoin=100.0)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        return {
            "balance_fedcoin": wallet.balance_fedcoin,
            "total_earned": wallet.total_earned
        }

    def subscribe_to_model_api(self, db: Session, entity_id: str, model_id: str, payment_amount: float) -> Dict[str, Any]:
        """
        Purchases API credits for a specific model using FedCoin.
        """
        # Find model pricing (model_id is version_id or hash)
        model = db.query(ModelVersion).filter(
            (ModelVersion.id == model_id) | (ModelVersion.model_hash == model_id)
        ).first()
        
        if not model:
            return {"error": "Model not found in marketplace."}

        wallet = db.query(Wallet).filter(Wallet.owner_id == entity_id).first()
        if not wallet or wallet.balance_fedcoin < payment_amount:
            return {"error": "Insufficient FedCoin balance."}

        # Deduct balance
        wallet.balance_fedcoin -= payment_amount
        
        # Calculate API credits (Inferences)
        credits_purchased = int(payment_amount / (model.price_per_inference or 0.01))
        
        # Update or Create Subscription
        sub = db.query(MarketplaceSubscription).filter(
            MarketplaceSubscription.entity_id == entity_id,
            MarketplaceSubscription.model_version_id == model.id
        ).first()
        
        if sub:
            sub.credits_remaining += credits_purchased
            sub.status = "active"
        else:
            sub = MarketplaceSubscription(
                entity_id=entity_id,
                model_version_id=model.id,
                credits_remaining=credits_purchased
            )
            db.add(sub)
        
        # Simulate Revenue Distribution via Smart Contract (Persistent)
        self._distribute_revenue(db, model, payment_amount, entity_id)
        
        db.commit()
        db.refresh(wallet)
        
        return {
            "message": "Subscription Successful",
            "subscription_id": f"sub_{sub.id}",
            "credits_added": credits_purchased,
            "new_balance": wallet.balance_fedcoin
        }
        
    def _distribute_revenue(self, db: Session, model: ModelVersion, amount: float, buyer_id: str):
        """Simulates splitting revenue to data providers and records it in DB."""
        share_info = json.loads(model.revenue_share_json) if model.revenue_share_json else {
            "developer": 30, "data_providers": 60, "platform_fee": 10
        }
        
        dev_share = (share_info.get("developer", 30) / 100) * amount
        prov_share = (share_info.get("data_providers", 60) / 100) * amount
        plat_share = amount - dev_share - prov_share

        # Record distribution
        record = RevenueRecord(
            model_version_id=model.id,
            buyer_id=buyer_id,
            amount_total=amount,
            developer_share=dev_share,
            data_providers_share=prov_share,
            platform_fee=plat_share
        )
        db.add(record)

        # Update Wallets (Simulating payout)
        # For simplicity, we split provider share between UCSF and Stanford if it's a "consortium" model
        ucsf_wallet = self._get_or_create_wallet(db, "ORG_UCSF")
        stanford_wallet = self._get_or_create_wallet(db, "ORG_STANFORD")
        
        ucsf_wallet.balance_fedcoin += prov_share * 0.6
        ucsf_wallet.total_earned += prov_share * 0.6
        
        stanford_wallet.balance_fedcoin += prov_share * 0.4
        stanford_wallet.total_earned += prov_share * 0.4

    def _get_or_create_wallet(self, db: Session, owner_id: str) -> Wallet:
        wallet = db.query(Wallet).filter(Wallet.owner_id == owner_id).first()
        if not wallet:
            wallet = Wallet(owner_id=owner_id, balance_fedcoin=0.0)
            db.add(wallet)
        return wallet

    def _format_model(self, m: ModelVersion) -> Dict:
        """Helper to format DB model for frontend JSON."""
        meta = json.loads(m.marketplace_metadata) if m.marketplace_metadata else {}
        shares = json.loads(m.revenue_share_json) if m.revenue_share_json else {
            "developer": 30, "data_providers": 60, "platform_fee": 10
        }
        
        return {
            "id": m.id,
            "name": meta.get("name", f"Model {m.version}"),
            "developer": meta.get("developer", "Consortium Partner"),
            "specialty": m.specialty,
            "architecture": meta.get("architecture", "Unknown"),
            "version": m.version,
            "accuracy": m.accuracy,
            "auc": m.auc,
            "price_per_inference": m.price_per_inference,
            "total_inferences": meta.get("total_inferences", 0),
            "revenue_share": shares,
            "metadata": meta
        }

# Singleton instance
marketplace_engine = MarketplaceService()

# Singleton instance
marketplace_engine = MarketplaceService()
