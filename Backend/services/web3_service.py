import time
import uuid
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models.platform_models import PatientPassportNFT, FedcoinTransaction, Wallet
from models.auth_models import User

class Web3SovereigntyService:
    """
    Manages Patient-owned Data Passports as Genomic NFTs and 
    handles Direct-to-Patient (D2P) FedCoin incentive distributions
    using persistent database records.
    """
    
    def mint_genomic_passport(self, db: Session, user: User, data_types: List[str]) -> Dict[str, Any]:
        """
        Mints a sovereign Data Passport NFT.
        """
        nft_id = f"p_nft_{uuid.uuid4().hex[:6]}"
        
        # In a real system, the DID might be fetched from PatientMetrics, but we can generate one if missing
        did_string = f"did:fedegene:pt_{user.id}"
        
        new_nft = PatientPassportNFT(
            nft_identifier=nft_id,
            patient_id=user.id,
            did_string=did_string,
            token_uri=f"ipfs://{uuid.uuid4().hex}/metadata.json",
            data_types=json.dumps(data_types),
            consent_active=True,
            earnings_fedcoin=0.0
        )
        db.add(new_nft)
        db.commit()
        db.refresh(new_nft)
        
        return {
            "message": "Genomic Passport Minted Successfully.", 
            "nft": {
                "id": new_nft.nft_identifier,
                "owner_did": new_nft.did_string,
                "token_uri": new_nft.token_uri,
                "data_types": json.loads(new_nft.data_types),
                "consent_active": new_nft.consent_active,
                "earnings_fedcoin": new_nft.earnings_fedcoin,
                "created_at": new_nft.created_at.timestamp() if new_nft.created_at else time.time()
            }
        }

    def get_patient_passports(self, db: Session, user: User) -> List[Dict]:
        """Returns all NFTs owned by a specific patient identity."""
        nfts = db.query(PatientPassportNFT).filter(PatientPassportNFT.patient_id == user.id).all()
        return [
            {
                "id": nft.nft_identifier,
                "owner_did": nft.did_string,
                "token_uri": nft.token_uri,
                "data_types": json.loads(nft.data_types),
                "consent_active": nft.consent_active,
                "earnings_fedcoin": nft.earnings_fedcoin,
                "created_at": nft.created_at.timestamp() if nft.created_at else time.time()
            } for nft in nfts
        ]

    def distribute_d2p_incentive(self, db: Session, nft_id: str, amount: float, reason: str) -> Dict[str, Any]:
        """
        Simulates a 'Data Dividend' airdrop directly to a patient's wallet.
        """
        nft = db.query(PatientPassportNFT).filter(PatientPassportNFT.nft_identifier == nft_id).first()
        if not nft:
            return {"error": "Genomic Passport not found."}
            
        # Update NFT earnings
        nft.earnings_fedcoin += amount
        
        # Update User Wallet and create Transaction
        wallet = db.query(Wallet).filter(Wallet.owner_id == f"USER_{nft.patient_id}").first()
        if wallet:
            wallet.balance_fedcoin += amount
            
            tx = FedcoinTransaction(
                wallet_id=wallet.id,
                activity=reason,
                reward_amount=f"+{amount} FC"
            )
            db.add(tx)
            
        db.commit()
        
        return {"message": f"Successfully airdropped {amount} FedCoin to Patient Wallet."}

# Singleton instance
web3_service = Web3SovereigntyService()
