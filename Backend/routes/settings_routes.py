from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
import secrets
import hashlib

from database.config import get_db
from models.auth_models import User
from models.platform_models import (
    OrgSettings, APIKey, DatasetPolicy, CryptoKey, 
    OrgMembership, Organization, Dataset
)
from routes.user_routes import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/platform", tags=["Platform Settings"])

# --- Pydantic Schemas ---
class OrgSettingsUpdate(BaseModel):
    default_epsilon: float
    require_admin_approval: bool
    alert_email_completed: bool
    alert_daily_summary: bool
    alert_security: bool

class ApiKeyCreate(BaseModel):
    name: str

class DatasetPolicyUpdate(BaseModel):
    allowed_org_types: list[str]
    min_epsilon: float
    usage_limit: str

# Helper to get user's primary org_id
def get_user_org_id(user: User, db: Session) -> int:
    membership = db.query(OrgMembership).filter(
        OrgMembership.user_id == user.id, 
        OrgMembership.is_primary == True
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="User does not belong to an organization.")
    return membership.org_id


# --- Org Settings ---
@router.get("/org/settings")
def get_org_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["platform_admin", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view org settings.")
    org_id = get_user_org_id(user, db)
    settings = db.query(OrgSettings).filter(OrgSettings.org_id == org_id).first()
    if not settings:
        # Create default settings if not exists
        settings = OrgSettings(org_id=org_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/org/settings")
def update_org_settings(data: OrgSettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["platform_admin", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update org settings.")
    org_id = get_user_org_id(user, db)
    settings = db.query(OrgSettings).filter(OrgSettings.org_id == org_id).first()
    if not settings:
        settings = OrgSettings(org_id=org_id)
        db.add(settings)
    
    settings.default_epsilon = data.default_epsilon
    settings.require_admin_approval = data.require_admin_approval
    settings.alert_email_completed = data.alert_email_completed
    settings.alert_daily_summary = data.alert_daily_summary
    settings.alert_security = data.alert_security
    
    db.commit()
    db.refresh(settings)
    return {"message": "Settings updated successfully", "settings": settings}


# --- API Keys ---
@router.get("/org/api-keys")
def list_api_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = get_user_org_id(user, db)
    keys = db.query(APIKey).filter(APIKey.org_id == org_id).all()
    # Mask the hash or provide a mock identifier prefix to the frontend
    return [{
        "id": k.id,
        "name": k.name,
        "identifier": f"fg_live_{k.key_hash[:8]}...",
        "is_active": k.is_active,
        "created_at": k.created_at,
        "last_used_at": k.last_used_at
    } for k in keys]

@router.post("/org/api-keys")
def generate_api_key(data: ApiKeyCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = get_user_org_id(user, db)
    
    # Generate actual secure key (only shown once)
    raw_secret = secrets.token_hex(32)
    key_prefix = "fg_live_" + secrets.token_hex(4)
    full_key = f"{key_prefix}_{raw_secret}"
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    
    new_key = APIKey(
        org_id=org_id,
        created_by=user.id,
        name=data.name,
        key_hash=key_hash,
    )
    db.add(new_key)
    db.commit()
    
    return {
        "message": "API Key generated! Save this secret now.",
        "api_key": full_key,
        "name": new_key.name
    }


# --- Dataset Policies ---
@router.get("/datasets/{dataset_id}/policies")
def get_dataset_policy(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify ownership
    org_id = get_user_org_id(user, db)
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.org_id == org_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized")
        
    policy = db.query(DatasetPolicy).filter(DatasetPolicy.dataset_id == dataset_id).first()
    if not policy:
        policy = DatasetPolicy(dataset_id=dataset_id)
        db.add(policy)
        db.commit()
        db.refresh(policy)
        
    return {
        "dataset_id": dataset_id,
        "allowed_org_types": json.loads(policy.allowed_org_types),
        "min_epsilon": policy.min_epsilon,
        "usage_limit": policy.usage_limit
    }

@router.put("/datasets/{dataset_id}/policies")
def update_dataset_policy(dataset_id: int, data: DatasetPolicyUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_id = get_user_org_id(user, db)
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.org_id == org_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized")
        
    policy = db.query(DatasetPolicy).filter(DatasetPolicy.dataset_id == dataset_id).first()
    if not policy:
        policy = DatasetPolicy(dataset_id=dataset_id)
        db.add(policy)
        
    policy.allowed_org_types = json.dumps(data.allowed_org_types)
    policy.min_epsilon = data.min_epsilon
    policy.usage_limit = data.usage_limit
    
    db.commit()
    return {"message": "Policy updated successfully"}


# --- Crypto Keys ---
@router.get("/security/keys")
def list_crypto_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["platform_admin", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view cryptographic keys")
        
    keys = db.query(CryptoKey).all()
    if not keys:
        # Seed some default system keys if empty just for the demo
        k1 = CryptoKey(key_type="HE Public Key", algorithm="Paillier (Sim)", identifier="fed_he_pub_live")
        k2 = CryptoKey(key_type="Integrity Secret", algorithm="HMAC-SHA256", identifier="fed_hmac_sec_live")
        db.add_all([k1, k2])
        db.commit()
        keys = db.query(CryptoKey).all()
        
    return keys
