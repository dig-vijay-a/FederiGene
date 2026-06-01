from database.config import SessionLocal, engine
from models import auth_models, platform_models
from datetime import datetime, timedelta
import hashlib
import json

def seed():
    db = SessionLocal()
    
    # 1. Ensure tables exist
    auth_models.Base.metadata.create_all(bind=engine)
    platform_models.Base.metadata.create_all(bind=engine)

    # 2. Find or Create User
    user = db.query(auth_models.User).filter(auth_models.User.username == "digvijay").first()
    if not user:
        print("User 'digvijay' not found. Please register first.")
        return

    # 3. Create Organizations
    ucsf = db.query(platform_models.Organization).filter(platform_models.Organization.name == "UCSF Medical Center").first()
    if not ucsf:
        ucsf = platform_models.Organization(
            name="UCSF Medical Center",
            org_type="hospital",
            contact_email="admin@ucsf.edu",
            country="USA",
            status=platform_models.OrgStatus.APPROVED,
            subscription_tier=platform_models.SubscriptionTier.INSTITUTIONAL
        )
        db.add(ucsf)
        db.commit()
        db.refresh(ucsf)
        print(f"Created Org: {ucsf.name}")

    # Link user to UCSF as admin
    membership = db.query(platform_models.OrgMembership).filter(platform_models.OrgMembership.user_id == user.id).first()
    if not membership:
        membership = platform_models.OrgMembership(user_id=user.id, org_id=ucsf.id, role=platform_models.UserRole.HOSPITAL_ADMIN)
        db.add(membership)
        user.role = "hospital_admin"
        db.commit()

    # 4. Create API Key for Local Node
    key_name = "Default Node Key"
    raw_key = "fg_test_key_12345"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    
    existing_key = db.query(platform_models.APIKey).filter(platform_models.APIKey.key_hash == key_hash).first()
    if not existing_key:
        db.add(platform_models.APIKey(org_id=ucsf.id, created_by=user.id, name=key_name, key_hash=key_hash))
        print(f"Created API Key: {raw_key} (Name: {key_name})")

    # 5. Create Training Jobs
    job1 = db.query(platform_models.TrainingJob).filter(platform_models.TrainingJob.name == "Oncology Predictive Model v2.1").first()
    if not job1:
        job1 = platform_models.TrainingJob(
            name="Oncology Predictive Model v2.1",
            description="Federated training for lung cancer early detection.",
            created_by=user.id,
            model_architecture="transformer",
            status=platform_models.TrainingJobStatus.RUNNING,
            total_rounds=10,
            current_round=3
        )
        db.add(job1)
        db.commit()
        db.refresh(job1)
        # Invite UCSF
        db.add(platform_models.TrainingParticipant(job_id=job1.id, dataset_id=1, org_id=ucsf.id, status="training"))
        print(f"Created Job: {job1.name} (ID: {job1.id})")

    # 6. Create Marketplace Models
    m1 = db.query(platform_models.ModelVersion).filter(platform_models.ModelVersion.version == "v1.2.0").first()
    if not m1:
        m1 = platform_models.ModelVersion(
            job_id=job1.id,
            version="v1.2.0",
            accuracy=0.942,
            auc=0.965,
            is_published=True,
            specialty="Oncology",
            price_per_inference=0.05,
            marketplace_metadata=json.dumps({
                "name": "CancerVision Pro",
                "developer": "FederiGene Consortium",
                "architecture": "ViT-Large",
                "description": "State-of-the-art vision transformer for multi-modal oncology screening."
            })
        )
        db.add(m1)
        print("Created Marketplace Model: CancerVision Pro")

    m2 = platform_models.ModelVersion(
        job_id=job1.id,
        version="v0.9.5",
        accuracy=0.887,
        auc=0.912,
        is_published=True,
        specialty="Cardiology",
        price_per_inference=0.02,
        marketplace_metadata=json.dumps({
            "name": "HeartFlow AI",
            "developer": "Stanford Health",
            "architecture": "ResNet-152",
            "description": "Predictive analytics for cardiovascular risk using genomic markers."
        })
    )
    db.add(m2)

    db.commit()
    print("Database seeding complete!")
    db.close()

if __name__ == "__main__":
    seed()
