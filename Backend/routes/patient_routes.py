from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from database.config import get_db
from models.auth_models import User
from models.platform_models import ConsentLedger, AuditLog, Wallet, PatientMetrics, FedcoinTransaction
from routes.user_routes import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/patient", tags=["Patient Dashboard"])

class FCMTokenPayload(BaseModel):
    token: str

@router.post("/fcm-token")
def update_fcm_token(payload: FCMTokenPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates the FCM push notification token for the patient device."""
    user.fcm_token = payload.token
    db.commit()
    return {"message": "FCM Token updated successfully"}

@router.get("/dashboard")
def get_patient_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns aggregated metrics for the patient's mobile dashboard."""
    wallet = db.query(Wallet).filter(Wallet.owner_id == f"USER_{user.id}").first()
    metrics = db.query(PatientMetrics).filter(PatientMetrics.patient_id == user.id).first()
    
    fedcoins = wallet.balance_fedcoin if wallet else 0.0
    aqi = metrics.aqi if metrics else 95.0
    did_string = metrics.did_string if metrics else None
    
    return {
        "fedcoins": fedcoins,
        "aqi": round(aqi, 1),
        "passport_status": "Active" if user.is_email_verified else "Pending Verification",
        "did_string": did_string,
        "last_sync": datetime.utcnow().isoformat()
    }

@router.get("/consents")
def get_patient_consents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns pending and active consents for the patient."""
    consents = db.query(ConsentLedger).filter(ConsentLedger.patient_id == user.id).all()
    
    result = []
    for c in consents:
        dataset = c.dataset
        result.append({
            "id": c.id,
            "dataset_id": dataset.id if dataset else None,
            "study_name": dataset.name if dataset else "Unknown Study",
            "requester": dataset.organization.name if dataset and dataset.organization else "Unknown Org",
            "status": c.status,
            "date": c.granted_at.isoformat() if c.granted_at else None,
            "training_use": c.training_use,
            "commercial_use": c.commercial_use
        })
    return result

@router.post("/consent/{id}/approve")
def approve_consent(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    consent = db.query(ConsentLedger).filter(ConsentLedger.id == id, ConsentLedger.patient_id == user.id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")
    
    consent.status = "approved"
    consent.training_use = True
    db.commit()
    return {"message": "Data usage approved successfully."}

@router.post("/consent/{id}/reject")
def reject_consent(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    consent = db.query(ConsentLedger).filter(ConsentLedger.id == id, ConsentLedger.patient_id == user.id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")
    
    consent.status = "rejected"
    consent.training_use = False
    db.commit()
    return {"message": "Data usage rejected."}

@router.get("/earnings")
def get_patient_earnings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns a ledger of FedCoin earnings."""
    wallet = db.query(Wallet).filter(Wallet.owner_id == f"USER_{user.id}").first()
    if not wallet:
        return []
        
    txns = db.query(FedcoinTransaction).filter(FedcoinTransaction.wallet_id == wallet.id).order_by(FedcoinTransaction.timestamp.desc()).all()
    
    return [
        {
            "id": f"tx_{t.id}",
            "activity": t.activity,
            "reward": t.reward_amount,
            "date": t.timestamp.isoformat() if t.timestamp else datetime.utcnow().isoformat()
        }
        for t in txns
    ]
