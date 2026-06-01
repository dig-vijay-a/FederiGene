from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import random

from database.config import get_db
from models.auth_models import User
from models.platform_models import ModelVersion, TrainingJob
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/platform", tags=["Explainability"])

# Simulate realistic genomic feature names
GENOMIC_FEATURES = [
    "BRCA1 Variant (rs80357382)", "BRCA2 Variant (rs80359550)",
    "TP53 Mutation (rs28934574)", "APOE e4 Allele",
    "CYP2D6*4 Allele", "HLA-B*57:01",
    "MTHFR C677T (rs1801133)", "Factor V Leiden",
    "EGFR Exon 19 Del", "KRAS G12C (rs121913529)",
    "MLH1 Methylation", "MSH2 Frameshift",
    "PTEN Loss-of-function", "PIK3CA E545K",
    "ALK Fusion", "RET Rearrangement",
    "TMB (> 10 mut/Mb)", "PD-L1 CPS Score",
    "Chromosome 1p/19q Codeletion", "IDH1 R132H"
]


@router.get("/models/{model_id}/shap")
def get_model_shap_values(
    model_id: int,
    top_n: int = 10,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns SHAP (SHapley Additive exPlanations) feature importance values
    for a given trained model version.

    Currently returns simulated SHAP values for demonstration.
    Future: wire to real `shap` library with exported model weights.
    """
    model = db.query(ModelVersion).filter(ModelVersion.id == model_id).first()
    if not model:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Model version not found")

    job = db.query(TrainingJob).filter(TrainingJob.id == model.job_id).first()
    
    # Try to extract real features from the datasets used in this training job
    real_features = []
    try:
        from models.platform_models import TrainingParticipant, Dataset
        import json
        participants = db.query(TrainingParticipant).filter(TrainingParticipant.job_id == job.id).all()
        for p in participants:
            ds = db.query(Dataset).filter(Dataset.id == p.dataset_id).first()
            if ds and ds.schema_json:
                schema = json.loads(ds.schema_json)
                for f in schema.get("features", []):
                    if f.get("name") not in real_features:
                        real_features.append(f.get("name"))
    except Exception as e:
        print(f"Error fetching real features for SHAP: {e}")
        
    # Fallback to hardcoded list if no schemas found
    feature_list = real_features if len(real_features) > 0 else GENOMIC_FEATURES

    # Seed with model_id for reproducibility (same model always gets same SHAP values)
    rng = random.Random(model_id * 42)

    # Generate simulated SHAP values — higher means more influential
    features = rng.sample(feature_list, min(top_n, len(feature_list)))
    shap_values = []
    for feat in features:
        shap_val = rng.uniform(0.01, 0.85)
        shap_values.append({
            "feature": feat,
            "shap_value": round(shap_val, 4),
            "direction": "positive" if rng.random() > 0.35 else "negative",
            "mean_abs": round(shap_val * rng.uniform(0.7, 1.0), 4)
        })

    # Sort by absolute importance descending
    shap_values.sort(key=lambda x: x["mean_abs"], reverse=True)

    return {
        "model_id": model_id,
        "model_version": model.version,
        "job_name": job.name if job else "Unknown",
        "accuracy": model.accuracy,
        "auc": model.auc,
        "shap_values": shap_values,
        "total_features_analyzed": len(feature_list),
        "top_n": top_n,
        "note": "SHAP values simulated. Wire shap library + real model weights for production."
    }
