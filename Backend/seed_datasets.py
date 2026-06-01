from database.config import SessionLocal, engine
from models import auth_models, platform_models
import json

def seed_datasets():
    db = SessionLocal()
    
    ucsf = db.query(platform_models.Organization).filter(platform_models.Organization.name == "UCSF Medical Center").first()
    if not ucsf:
        print("UCSF not found, run seed_data.py first.")
        return
        
    user = db.query(auth_models.User).filter(auth_models.User.username == "digvijay").first()
    
    # Dataset 1: Genomics
    ds1 = platform_models.Dataset(
        org_id=ucsf.id,
        registered_by=user.id if user else 1,
        name="UCSF BRCA1 Genomics Cohort",
        data_type="genomic",
        description="Whole genome sequencing data for breast cancer patients with known BRCA1/2 variants.",
        row_count=2500,
        feature_count=15000,
        consent_type="broad_research",
        status=platform_models.DatasetStatus.ACTIVE,
        schema_json=json.dumps({
            "features": [
                {"name": "age", "type": "int", "min": 25, "max": 90},
                {"name": "gender", "type": "categorical", "values": ["F", "M"]},
                {"name": "BRCA1_expression", "type": "float", "min": -2.0, "max": 2.0},
                {"name": "TP53_mutation", "type": "categorical", "values": ["True", "False"]},
                {"name": "tumor_stage", "type": "categorical", "values": ["I", "II", "III", "IV"]},
                {"name": "survival_months", "type": "int", "min": 1, "max": 120}
            ]
        })
    )
    db.add(ds1)
    
    # Dataset 2: Cardiology Clinical
    ds2 = platform_models.Dataset(
        org_id=ucsf.id,
        registered_by=user.id if user else 1,
        name="CardioGenomics Network Data",
        data_type="clinical",
        description="EHR records and lifestyle metrics for cardiovascular patients.",
        row_count=8500,
        feature_count=45,
        consent_type="specific_disease",
        status=platform_models.DatasetStatus.ACTIVE,
        schema_json=json.dumps({
            "features": [
                {"name": "age", "type": "int", "min": 40, "max": 95},
                {"name": "systolic_bp", "type": "int", "min": 90, "max": 200},
                {"name": "cholesterol_ldl", "type": "float", "min": 50.0, "max": 250.0},
                {"name": "smoking_status", "type": "categorical", "values": ["Never", "Former", "Current"]},
                {"name": "cvd_event", "type": "categorical", "values": ["True", "False"]}
            ]
        })
    )
    db.add(ds2)
    db.commit()
    print("Added Datasets!")
    db.close()

if __name__ == "__main__":
    seed_datasets()
