import os
import sys
import hashlib
import json
import pyotp
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Ensure Backend is in python path and load .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

if not os.getenv("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "federigene_development_secret_key_fixed_998877"

import torch
import torch.nn as nn
from database.config import SessionLocal, engine
from models import auth_models, platform_models
from utils import security as auth_utils

def seed_demo_data():
    print("=" * 60)
    print("  FEDERIGENE COMPREHENSIVE DEMO DATA SEEDER")
    print("=" * 60)
    
    db = SessionLocal()
    
    # 1. Ensure all tables exist
    auth_models.Base.metadata.create_all(bind=engine)
    platform_models.Base.metadata.create_all(bind=engine)
    
    # 2. Ensure Security Questions
    DEFAULT_QUESTIONS = [
        "What city were you born in?",
        "What is your mother's maiden name?",
        "What was the name of your first pet?",
        "What is your favorite book?",
        "What high school did you attend?"
    ]
    for q_text in DEFAULT_QUESTIONS:
        if not db.query(auth_models.SecurityQuestion).filter_by(question_text=q_text).first():
            db.add(auth_models.SecurityQuestion(question_text=q_text))
    db.commit()
    q1 = db.query(auth_models.SecurityQuestion).first()
    
    # 3. Create or Update Core Test Users
    # Password for all demo accounts: Password123!
    default_pwd_hash = auth_utils.get_password_hash("Password123!")
    default_security_answer_hash = auth_utils.get_password_hash("san francisco")
    
    ACCOUNTS = [
        {
            "username": "sysadmin",
            "email": "sysadmin@federigene.com",
            "role": "platform_admin",
            "first_name": "System",
            "last_name": "Administrator",
            "display_name": "Platform Superadmin",
        },
        {
            "username": "hospital_ucsf",
            "email": "ucsf_admin@federigene.com",
            "role": "hospital_admin",
            "first_name": "Sarah",
            "last_name": "Chen",
            "display_name": "Dr. Sarah Chen (UCSF)",
        },
        {
            "username": "hospital_mayo",
            "email": "mayo_admin@federigene.com",
            "role": "hospital_admin",
            "first_name": "Robert",
            "last_name": "Taylor",
            "display_name": "Dr. Robert Taylor (Mayo)",
        },
        {
            "username": "lead_researcher",
            "email": "researcher@federigene.com",
            "role": "researcher",
            "first_name": "Elena",
            "last_name": "Rostova",
            "display_name": "Dr. Elena Rostova",
        },
        {
            "username": "patient_alice",
            "email": "patient_alice@federigene.com",
            "role": "patient",
            "first_name": "Alice",
            "last_name": "Henderson",
            "display_name": "Alice Henderson",
        }
    ]
    
    user_map = {}
    for acc in ACCOUNTS:
        u = db.query(auth_models.User).filter(
            (auth_models.User.username == acc["username"]) | (auth_models.User.email == acc["email"])
        ).first()
        if not u:
            u = auth_models.User(
                username=acc["username"],
                email=acc["email"],
                password_hash=default_pwd_hash,
                is_email_verified=True,
                totp_secret="JBSWY3DPEHPK3PXP", # Standard deterministic secret
                role=acc["role"],
                first_name=acc["first_name"],
                last_name=acc["last_name"],
                display_name=acc["display_name"],
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            print(f"[User Created] {u.username} ({u.role}) -> {u.email}")
        else:
            u.password_hash = default_pwd_hash
            u.is_email_verified = True
            u.totp_secret = "JBSWY3DPEHPK3PXP"
            u.role = acc["role"]
            u.first_name = acc["first_name"]
            u.last_name = acc["last_name"]
            u.display_name = acc["display_name"]
            db.commit()
            print(f"[User Updated] {u.username} ({u.role}) -> {u.email}")
        
        # Ensure security question answer exists
        if q1 and not db.query(auth_models.UserSecurityAnswer).filter_by(user_id=u.id, question_id=q1.id).first():
            db.add(auth_models.UserSecurityAnswer(user_id=u.id, question_id=q1.id, answer_hash=default_security_answer_hash))
        
        user_map[acc["username"]] = u
    db.commit()
    
    # 4. Organizations
    org_ucsf = db.query(platform_models.Organization).filter_by(name="UCSF Medical Center").first()
    if not org_ucsf:
        org_ucsf = platform_models.Organization(
            name="UCSF Medical Center",
            org_type="hospital",
            contact_email="admin@ucsf.edu",
            country="USA",
            status=platform_models.OrgStatus.APPROVED,
            subscription_tier=platform_models.SubscriptionTier.INSTITUTIONAL
        )
        db.add(org_ucsf)
        db.commit()
        db.refresh(org_ucsf)
    
    org_mayo = db.query(platform_models.Organization).filter_by(name="Mayo Clinic Genomics").first()
    if not org_mayo:
        org_mayo = platform_models.Organization(
            name="Mayo Clinic Genomics",
            org_type="hospital",
            contact_email="admin@mayo.edu",
            country="USA",
            status=platform_models.OrgStatus.APPROVED,
            subscription_tier=platform_models.SubscriptionTier.INSTITUTIONAL
        )
        db.add(org_mayo)
        db.commit()
        db.refresh(org_mayo)

    org_consortium = db.query(platform_models.Organization).filter_by(name="FederiGene Consortium").first()
    if not org_consortium:
        org_consortium = platform_models.Organization(
            name="FederiGene Consortium",
            org_type="research_institute",
            contact_email="info@federigene.com",
            country="Global",
            status=platform_models.OrgStatus.APPROVED,
            subscription_tier=platform_models.SubscriptionTier.INSTITUTIONAL
        )
        db.add(org_consortium)
        db.commit()
        db.refresh(org_consortium)

    # Org Memberships
    def link_membership(user, org, role):
        m = db.query(platform_models.OrgMembership).filter_by(user_id=user.id).first()
        if not m:
            m = platform_models.OrgMembership(user_id=user.id, org_id=org.id, role=role, is_primary=True)
            db.add(m)
        else:
            m.org_id = org.id
            m.role = role
        db.commit()

    link_membership(user_map["hospital_ucsf"], org_ucsf, platform_models.UserRole.HOSPITAL_ADMIN)
    link_membership(user_map["hospital_mayo"], org_mayo, platform_models.UserRole.HOSPITAL_ADMIN)
    link_membership(user_map["lead_researcher"], org_consortium, platform_models.UserRole.RESEARCHER)
    link_membership(user_map["sysadmin"], org_consortium, platform_models.UserRole.PLATFORM_ADMIN)

    # 5. Fixed API Keys for Local Node Training
    # UCSF API Key: fg_ucsf_demo_key_7a8b9c
    raw_key_ucsf = "fg_ucsf_demo_key_7a8b9c"
    hash_ucsf = hashlib.sha256(raw_key_ucsf.encode()).hexdigest()
    if not db.query(platform_models.APIKey).filter_by(key_hash=hash_ucsf).first():
        db.add(platform_models.APIKey(
            org_id=org_ucsf.id,
            created_by=user_map["hospital_ucsf"].id,
            name="UCSF Node Key #1",
            key_hash=hash_ucsf
        ))

    # Mayo API Key: fg_mayo_demo_key_1e2f3a
    raw_key_mayo = "fg_mayo_demo_key_1e2f3a"
    hash_mayo = hashlib.sha256(raw_key_mayo.encode()).hexdigest()
    if not db.query(platform_models.APIKey).filter_by(key_hash=hash_mayo).first():
        db.add(platform_models.APIKey(
            org_id=org_mayo.id,
            created_by=user_map["hospital_mayo"].id,
            name="Mayo Clinic Node Key #1",
            key_hash=hash_mayo
        ))
    db.commit()

    # 6. Registered Datasets
    ds_ucsf = db.query(platform_models.Dataset).filter_by(name="UCSF Oncology Cohort (Chr 17/13)").first()
    if not ds_ucsf:
        ds_ucsf = platform_models.Dataset(
            org_id=org_ucsf.id,
            registered_by=user_map["hospital_ucsf"].id,
            name="UCSF Oncology Cohort (Chr 17/13)",
            data_type="genomic",
            row_count=500,
            feature_count=10,
            status="active"
        )
        db.add(ds_ucsf)
        db.commit()
        db.refresh(ds_ucsf)

    ds_mayo = db.query(platform_models.Dataset).filter_by(name="Mayo Clinic Pan-Cancer Registry").first()
    if not ds_mayo:
        ds_mayo = platform_models.Dataset(
            org_id=org_mayo.id,
            registered_by=user_map["hospital_mayo"].id,
            name="Mayo Clinic Pan-Cancer Registry",
            data_type="genomic",
            row_count=500,
            feature_count=10,
            status="active"
        )
        db.add(ds_mayo)
        db.commit()
        db.refresh(ds_mayo)

    # 7. Training Jobs
    job1 = db.query(platform_models.TrainingJob).filter_by(name="Oncology Biomarker Predictor v2.1").first()
    if not job1:
        job1 = platform_models.TrainingJob(
            name="Oncology Biomarker Predictor v2.1",
            description="Collaborative federated deep learning across UCSF and Mayo for early oncology classification.",
            created_by=user_map["lead_researcher"].id,
            model_architecture="linear_classifier",
            status=platform_models.TrainingJobStatus.RUNNING,
            total_rounds=3,
            current_round=1
        )
        db.add(job1)
        db.commit()
        db.refresh(job1)

        # Add participants
        db.add(platform_models.TrainingParticipant(job_id=job1.id, dataset_id=ds_ucsf.id, org_id=org_ucsf.id, status="waiting"))
        db.add(platform_models.TrainingParticipant(job_id=job1.id, dataset_id=ds_mayo.id, org_id=org_mayo.id, status="waiting"))
        db.commit()

    # 8. Model Registry & Saved Weights (.pt)
    weights_dir = os.path.join(backend_dir, "temp_weights")
    os.makedirs(weights_dir, exist_ok=True)
    
    # Save a baseline PyTorch model
    baseline_model = nn.Linear(10, 2)
    
    mv1 = db.query(platform_models.ModelVersion).filter_by(job_id=job1.id, version="v2.1").first()
    if not mv1:
        mv1 = platform_models.ModelVersion(
            job_id=job1.id,
            version="v2.1",
            accuracy=0.942,
            auc=0.965,
            f1_score=0.932,
            loss=0.082,
            round_number=1,
            is_published=True,
            specialty="Oncology",
            price_per_inference=0.05,
            marketplace_metadata=json.dumps({
                "name": "OncoPredict Global v2.1",
                "architecture": "PyTorch Linear(10, 2)",
                "description": "Federated model trained across 1,000 multi-center genomic profiles for high-accuracy disease risk screening."
            })
        )
        db.add(mv1)
        db.commit()
        db.refresh(mv1)
    
    # Save weights file for mv1
    mv1_weight_file = os.path.join(weights_dir, f"global_job_{job1.id}_round_{mv1.round_number}.pt")
    torch.save(baseline_model.state_dict(), mv1_weight_file)

    # 9. Patient Alice's Patient App Profile
    alice = user_map["patient_alice"]
    
    # Patient Metrics
    metrics = db.query(platform_models.PatientMetrics).filter_by(patient_id=alice.id).first()
    if not metrics:
        metrics = platform_models.PatientMetrics(
            patient_id=alice.id,
            aqi=96.4,
            did_string="did:federigene:pt_alice_0x7B8C4D9E1A2F3E4B"
        )
        db.add(metrics)
    else:
        metrics.aqi = 96.4
        metrics.did_string = "did:federigene:pt_alice_0x7B8C4D9E1A2F3E4B"

    # Patient Wallet
    wallet = db.query(platform_models.Wallet).filter_by(owner_id=f"USER_{alice.id}").first()
    if not wallet:
        wallet = platform_models.Wallet(
            owner_id=f"USER_{alice.id}",
            balance_fedcoin=250.0,
            total_earned=250.0
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    else:
        wallet.balance_fedcoin = 250.0
        wallet.total_earned = 250.0
        db.commit()

    # Patient Transactions
    if db.query(platform_models.FedcoinTransaction).filter_by(wallet_id=wallet.id).count() == 0:
        db.add(platform_models.FedcoinTransaction(
            wallet_id=wallet.id,
            activity="Consortium Oncology Study Phase 1 Grant",
            reward_amount="+150 FC",
            timestamp=datetime.utcnow() - timedelta(days=2)
        ))
        db.add(platform_models.FedcoinTransaction(
            wallet_id=wallet.id,
            activity="Dynamic Consent Reward: UCSF Cohort Access",
            reward_amount="+100 FC",
            timestamp=datetime.utcnow() - timedelta(hours=6)
        ))

    # Patient Passport NFT
    nft = db.query(platform_models.PatientPassportNFT).filter_by(patient_id=alice.id).first()
    if not nft:
        nft = platform_models.PatientPassportNFT(
            nft_identifier="OMEGA-7701",
            patient_id=alice.id,
            did_string="did:federigene:pt_alice_0x7B8C4D9E1A2F3E4B",
            token_uri="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
            data_types=json.dumps(["WGS_Chr17", "RNA_Seq_Expression", "Clinical_Phenotype"]),
            consent_active=True,
            earnings_fedcoin=250.0
        )
        db.add(nft)

    # Consent Ledger for Alice: 1 Pending (allows live testing Approve/Reject), 1 Approved
    c_pending = db.query(platform_models.ConsentLedger).filter_by(patient_id=alice.id, dataset_id=ds_ucsf.id).first()
    if not c_pending:
        c_pending = platform_models.ConsentLedger(
            dataset_id=ds_ucsf.id,
            patient_id=alice.id,
            patient_pseudonym="PT-ALICE-001",
            status="pending",
            training_use=False,
            commercial_use=False
        )
        db.add(c_pending)

    c_approved = db.query(platform_models.ConsentLedger).filter_by(patient_id=alice.id, dataset_id=ds_mayo.id).first()
    if not c_approved:
        c_approved = platform_models.ConsentLedger(
            dataset_id=ds_mayo.id,
            patient_id=alice.id,
            patient_pseudonym="PT-ALICE-001",
            status="approved",
            training_use=True,
            commercial_use=False,
            granted_at=datetime.utcnow() - timedelta(days=5)
        )
        db.add(c_approved)

    db.commit()
    db.close()

    print("=" * 60)
    print("  SEEDING COMPLETE! ALL TEST DATA & ACCOUNTS READY")
    print("=" * 60)
    print("Credentials (Password for all accounts: Password123!):")
    print("  1. Platform Admin:  sysadmin@federigene.com / sysadmin")
    print("  2. UCSF Hospital:   ucsf_admin@federigene.com / hospital_ucsf (Key: fg_ucsf_demo_key_7a8b9c)")
    print("  3. Mayo Hospital:   mayo_admin@federigene.com / hospital_mayo (Key: fg_mayo_demo_key_1e2f3a)")
    print("  4. Researcher:      researcher@federigene.com / lead_researcher")
    print("  5. Patient App:     patient_alice@federigene.com / patient_alice")
    print("=" * 60)

if __name__ == "__main__":
    seed_demo_data()

