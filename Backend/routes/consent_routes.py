from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json
from firebase_admin import messaging

from database.config import get_db
from models.auth_models import User
from models.platform_models import Dataset, ConsentLedger, AuditLog
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/platform", tags=["Consent Ledger"])

@router.get("/datasets/{dataset_id}/consent")
def list_dataset_consents(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all consent records for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Security check: platform admin or same org
    if user.role != "platform_admin":
        from models.platform_models import OrgMembership
        membership = db.query(OrgMembership).filter(OrgMembership.user_id == user.id, OrgMembership.org_id == dataset.org_id).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Access denied")

    consents = db.query(ConsentLedger).filter(ConsentLedger.dataset_id == dataset_id).all()
    return consents

from pydantic import BaseModel

class ConsentRequestPayload(BaseModel):
    patient_username: str

@router.post("/datasets/{dataset_id}/request-consent")
def request_patient_consent(
    dataset_id: int,
    req: ConsentRequestPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request consent from a specific patient."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    patient = db.query(User).filter(User.username == req.patient_username).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Enforce uniqueness rule: Cannot request consent if already requested/granted
    existing_consent = db.query(ConsentLedger).filter(
        ConsentLedger.dataset_id == dataset_id,
        ConsentLedger.patient_id == patient.id
    ).first()
    
    if existing_consent:
        raise HTTPException(status_code=400, detail="Consent request already exists for this patient in this dataset.")
        
    consent = ConsentLedger(
        dataset_id=dataset_id,
        patient_id=patient.id,
        patient_pseudonym=f"Patient {patient.id}",
        status="pending",
        training_use=False,
        academic_use=False,
        commercial_use=False
    )
    db.add(consent)
    db.commit()

    # Dispatch Push Notification
    if patient.fcm_token:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title="⚠️ New Consent Request",
                    body=f"{dataset.organization.name if dataset.organization else 'An organization'} is requesting access to your data for '{dataset.name}'.",
                ),
                token=patient.fcm_token,
            )
            response = messaging.send(message)
            print("Successfully sent FCM message:", response)
        except Exception as e:
            print("Failed to send FCM message:", e)

    return {"message": "Consent request sent to patient."}

@router.post("/consent/{consent_id}/revoke")
def revoke_consent(
    consent_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific consent record."""
    consent = db.query(ConsentLedger).filter(ConsentLedger.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")
        
    consent.revoked_at = datetime.utcnow()
    
    # Audit trail
    db.add(AuditLog(
        user_id=user.id,
        action="consent_revoked",
        resource_type="consent",
        resource_id=consent.id,
        details=json.dumps({"dataset_id": consent.dataset_id})
    ))
    db.commit()
    return {"message": "Consent revoked successfully"}

@router.post("/consent/{consent_id}/gdpr-delete")
def gdpr_delete_request(
    consent_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Raise a GDPR deletion request for a patient record."""
    consent = db.query(ConsentLedger).filter(ConsentLedger.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")
        
    consent.gdpr_delete_requested = True
    
    # Audit trail
    db.add(AuditLog(
        user_id=user.id,
        action="gdpr_deletion_requested",
        resource_type="consent",
        resource_id=consent.id,
        details=json.dumps({"dataset_id": consent.dataset_id})
    ))
    db.commit()
    return {"message": "GDPR deletion request recorded in immutable ledger"}
