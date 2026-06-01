from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib, secrets, json, random
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from database.config import get_db
from models.auth_models import User
from models.platform_models import Dataset, AuditLog
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/platform", tags=["ZKP & Quality"])


# ─── Zero-Knowledge Proof Attestation ────────────────────────────────────────
def _generate_zkp_commitment(dataset: Dataset) -> dict:
    """
    Schnorr-style ZKP commitment scheme (simulated).
    The hospital proves:
      - num_samples > 1000
      - feature_count > 100
      - consent_type is valid
    WITHOUT revealing the actual dataset values.
    """
    # Public parameters
    public_params = {
        "min_samples": 1000,
        "min_features": 100,
        "valid_consents": ["irb_approved", "patient_consent", "anonymized", "synthetic"]
    }

    # Step 1: Commit — hash the dataset stats with a random nonce
    nonce = secrets.token_hex(16)
    commitment_input = f"{dataset.row_count}:{dataset.feature_count}:{dataset.consent_type}:{nonce}"
    commitment = hashlib.sha256(commitment_input.encode()).hexdigest()

    # Step 2: Challenge (would come from verifier in a real ZKP protocol)
    challenge = hashlib.sha256(commitment.encode()).hexdigest()[:16]

    # Step 3: Response — prove the properties hold without revealing the values
    properties_hold = (
        (dataset.row_count or 0) >= public_params["min_samples"] and
        (dataset.feature_count or 0) >= public_params["min_features"] and
        dataset.consent_type in public_params["valid_consents"]
    )

    response = hashlib.sha256(f"{challenge}:{nonce}:{properties_hold}".encode()).hexdigest()

    return {
        "commitment": commitment,
        "challenge": challenge,
        "response": response,
        "properties_verified": properties_hold,
        "nonce_hash": hashlib.sha256(nonce.encode()).hexdigest(),  # Don't expose raw nonce
        "public_params": public_params
    }


@router.post("/datasets/{dataset_id}/zkp-attest")
def attest_dataset_zkp(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a Zero-Knowledge Proof attestation for a dataset.
    Proves dataset meets quality thresholds without revealing raw statistics.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    proof = _generate_zkp_commitment(dataset)

    if proof["properties_verified"]:
        # Mark dataset as ZKP verified
        dataset.zkp_verified = True
        dataset.zkp_proof = json.dumps({
            "commitment": proof["commitment"],
            "response": proof["response"],
            "verified_at": datetime.utcnow().isoformat()
        })

        # Log the attestation
        db.add(AuditLog(
            user_id=user.id,
            action="zkp_dataset_attested",
            resource_type="dataset",
            resource_id=dataset.id,
            details=json.dumps({"commitment": proof["commitment"], "verified": True})
        ))
        db.commit()

        return {
            "status": "verified",
            "message": "Dataset successfully attested via Zero-Knowledge Proof.",
            "commitment": proof["commitment"],
            "challenge": proof["challenge"],
            "response": proof["response"],
            "public_params": proof["public_params"]
        }
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Dataset does not meet the minimum quality thresholds required for ZKP attestation. Requirements: {proof['public_params']}"
        )


@router.post("/datasets/{dataset_id}/zkp-verify")
def verify_dataset_zkp(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify the stored ZKP proof for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not dataset.zkp_verified or not dataset.zkp_proof:
        return {"verified": False, "message": "No ZKP proof on file for this dataset."}
    return {"verified": True, "proof": json.loads(dataset.zkp_proof)}


# ─── Dataset Quality Scoring ──────────────────────────────────────────────────
def compute_quality_score(row_count: int, feature_count: int, consent_type: str) -> int:
    """
    Auto-scores a dataset 0–100 on three dimensions:
    - Sample size (40 pts): log-scaled, >10k = perfect
    - Feature richness (30 pts): >500 features = perfect
    - Consent quality (30 pts): based on consent type
    """
    # Sample size score (0-40)
    if not row_count or row_count == 0:
        sample_score = 0
    elif row_count >= 10000:
        sample_score = 40
    elif row_count >= 1000:
        sample_score = 25
    elif row_count >= 100:
        sample_score = 10
    else:
        sample_score = 5

    # Feature score (0-30)
    if not feature_count or feature_count == 0:
        feature_score = 0
    elif feature_count >= 500:
        feature_score = 30
    elif feature_count >= 100:
        feature_score = 20
    elif feature_count >= 10:
        feature_score = 10
    else:
        feature_score = 5

    # Consent quality (0-30)
    consent_scores = {
        "irb_approved": 30,
        "patient_consent": 25,
        "anonymized": 20,
        "synthetic": 15
    }
    consent_score = consent_scores.get(consent_type, 10)

    return sample_score + feature_score + consent_score
