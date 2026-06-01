from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.config import Base
import enum


# ── Enums ──────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    PLATFORM_ADMIN = "platform_admin"
    HOSPITAL_ADMIN = "hospital_admin"
    RESEARCHER = "researcher"
    DATA_CUSTODIAN = "data_custodian"
    AUDITOR = "auditor"
    TESTER = "tester"

class OrgStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class TrainingJobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    AGGREGATING = "aggregating"
    COMPLETED = "completed"
    FAILED = "failed"

class DatasetStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    RESEARCH = "research"
    PROFESSIONAL = "professional"
    INSTITUTIONAL = "institutional"


# ── Organization ───────────────────────────────────────────────────
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    org_type = Column(String(50), nullable=False)  # hospital, lab, research_institute
    license_number = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    
    # Verification Details
    tax_id = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    representative_name = Column(String(255), nullable=True)
    representative_role = Column(String(100), nullable=True)
    legal_document_url = Column(Text, nullable=True)

    status = Column(SQLEnum(OrgStatus), default=OrgStatus.PENDING, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    
    # Phase 5: Commercialization
    subscription_tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE, nullable=False)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    license_key = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)

    members = relationship("OrgMembership", back_populates="organization", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")


# ── Organization Membership ───────────────────────────────────────
class OrgMembership(Base):
    __tablename__ = "org_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_primary = Column(Boolean, default=True)  # Primary org for the user

    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="members")


# ── Dataset (Metadata Only) ───────────────────────────────────────
class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    registered_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data_type = Column(String(100), nullable=False)  # genomic, clinical, imaging, etc.
    schema_json = Column(Text, nullable=True)  # JSON schema of the dataset
    row_count = Column(Integer, nullable=True)
    feature_count = Column(Integer, nullable=True)
    status = Column(SQLEnum(DatasetStatus), default=DatasetStatus.ACTIVE, nullable=False)
    consent_type = Column(String(100), nullable=True)  # irb_approved, patient_consent, anonymized
    quality_score = Column(Integer, nullable=True)  # 0-100 score
    zkp_verified = Column(Boolean, default=False)
    zkp_proof = Column(Text, nullable=True)  # JSON proof data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="datasets")
    registrar = relationship("User")
    participations = relationship("TrainingParticipant", back_populates="dataset")


# ── Training Job (Federated Learning) ─────────────────────────────
class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_architecture = Column(String(100), nullable=False)  # cnn, lstm, transformer, etc.
    target_metric = Column(String(50), nullable=True)  # accuracy, auc, f1
    privacy_budget = Column(Float, nullable=True)  # epsilon for differential privacy
    total_rounds = Column(Integer, default=10)
    current_round = Column(Integer, default=0)
    status = Column(SQLEnum(TrainingJobStatus), default=TrainingJobStatus.PENDING, nullable=False)
    hyperparams_json = Column(Text, nullable=True)  # JSON hyperparameters
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User")
    participants = relationship("TrainingParticipant", back_populates="training_job", cascade="all, delete-orphan")
    model_versions = relationship("ModelVersion", back_populates="training_job", cascade="all, delete-orphan")


# ── Training Participant (which datasets participate) ──────────────
class TrainingParticipant(Base):
    __tablename__ = "training_participants"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("training_jobs.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    status = Column(String(50), default="pending")  # pending, training, completed, failed
    current_round = Column(Integer, default=0)
    local_loss = Column(Float, nullable=True)
    hmac_hash = Column(String(255), nullable=True)  # HMAC of model update for integrity

    training_job = relationship("TrainingJob", back_populates="participants")
    dataset = relationship("Dataset", back_populates="participations")


# ── Model Version (Model Registry) ────────────────────────────────
class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("training_jobs.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(20), nullable=False)  # v1.0, v1.1, etc.
    accuracy = Column(Float, nullable=True)
    auc = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    loss = Column(Float, nullable=True)
    round_number = Column(Integer, nullable=True)
    model_hash = Column(String(255), nullable=True)  # SHA256 hash of model weights
    hmac_signature = Column(String(255), nullable=True)  # Integrity verification
    
    # ── Marketplace Integration ──
    is_published = Column(Boolean, default=False)
    specialty = Column(String(50), nullable=True)  # e.g., Oncology, Cardiology
    price_per_inference = Column(Float, default=0.01) # In FedCoin
    revenue_share_json = Column(Text, nullable=True) # JSON: {"developer": 30, "data_providers": 60, "platform_fee": 10}
    marketplace_metadata = Column(Text, nullable=True) # JSON for extra discovery info
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    training_job = relationship("TrainingJob", back_populates="model_versions")


# ── Marketplace Wallet ──────────────────────────────────────────
class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String(100), unique=True, index=True, nullable=False) # ORG_UCSF, USER_1, etc.
    balance_fedcoin = Column(Float, default=100.0)
    total_earned = Column(Float, default=0.0)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ── Marketplace Subscription ─────────────────────────────────────
class MarketplaceSubscription(Base):
    __tablename__ = "marketplace_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(String(100), index=True, nullable=False) # Who bought it
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    credits_remaining = Column(Integer, default=0)
    status = Column(String(20), default="active") # active, exhausted, cancelled
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    model_version = relationship("ModelVersion")


# ── Revenue Record (Smart Contract Simulation) ───────────────────
class RevenueRecord(Base):
    __tablename__ = "revenue_records"

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    buyer_id = Column(String(100), nullable=False)
    amount_total = Column(Float, nullable=False)
    
    # Splits (JSON or explicit)
    developer_share = Column(Float, nullable=False)
    data_providers_share = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    model_version = relationship("ModelVersion")


# ── Audit Log ─────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    action = Column(String(100), nullable=False)  # login, model_download, training_started, etc.
    resource_type = Column(String(50), nullable=True)  # dataset, model, training_job
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON with extra context
    ip_address = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


# ── API Key ───────────────────────────────────────────────────────
class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="api_keys")
    creator = relationship("User")

# ── Org Settings ──────────────────────────────────────────────────
class OrgSettings(Base):
    __tablename__ = 'org_settings'
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey('organizations.id', ondelete="CASCADE"), unique=True, nullable=False)
    default_epsilon = Column(Float, default=2.0)
    require_admin_approval = Column(Boolean, default=False)
    alert_email_completed = Column(Boolean, default=True)
    alert_daily_summary = Column(Boolean, default=True)
    alert_security = Column(Boolean, default=True)
    
    organization = relationship("Organization")

# ── Dataset Policy ────────────────────────────────────────────────
class DatasetPolicy(Base):
    __tablename__ = 'dataset_policies'
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey('datasets.id', ondelete="CASCADE"), unique=True, nullable=False)
    allowed_org_types = Column(Text, default="[]") 
    min_epsilon = Column(Float, default=1.0)
    usage_limit = Column(String(50), default='unlimited')
    
    dataset = relationship("Dataset")

# ── Crypto Key ────────────────────────────────────────────────────
class CryptoKey(Base):
    __tablename__ = 'crypto_keys'
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey('organizations.id', ondelete="CASCADE"), nullable=True)
    key_type = Column(String(50), nullable=False) 
    algorithm = Column(String(50), nullable=False)
    identifier = Column(String(100), nullable=False) 
    status = Column(String(20), default='Active')
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Consent Ledger (GDPR-Ready) ───────────────────────────────────
class ConsentLedger(Base):
    __tablename__ = "consent_ledger"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    patient_pseudonym = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    training_use = Column(Boolean, default=False)
    academic_use = Column(Boolean, default=False)
    commercial_use = Column(Boolean, default=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    gdpr_delete_requested = Column(Boolean, default=False)
    
    dataset = relationship("Dataset")


# ── Model Evaluation (Federated Benchmarking) ─────────────────────
class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False)
    eval_accuracy = Column(Float, nullable=True)
    eval_auc = Column(Float, nullable=True)
    eval_f1 = Column(Float, nullable=True)
    participating_nodes = Column(Integer, default=0)
    eval_type = Column(String(50), default="held_out_test")  # held_out_test, external_validation
    details_json = Column(Text, nullable=True)  # Detailed per-node metrics
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    model_version = relationship("ModelVersion")


# ── Sales Lead Status ─────────────────────────────────────────────
class SalesLeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    APPROVED = "approved"
    REJECTED = "rejected"


# ── Sales Lead (Enterprise Inquiry Tracking) ──────────────────────
class SalesLead(Base):
    __tablename__ = "sales_leads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    requested_tier = Column(String(50), nullable=False, default="institutional")
    status = Column(SQLEnum(SalesLeadStatus), default=SalesLeadStatus.NEW, nullable=False)
    admin_notes = Column(Text, nullable=True)
    custom_price = Column(Float, nullable=True) # Negotiated price in INR
    invoice_id = Column(String(100), nullable=True) # Tracking for generation
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    requester = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization")
    resolver = relationship("User", foreign_keys=[resolved_by])


# ── Decentralized Trust Ledger (Blockchain State) ─────────────────
class TrustLedgerBlock(Base):
    __tablename__ = "trust_ledger_blocks"

    id = Column(Integer, primary_key=True, index=True)
    block_number = Column(Integer, unique=True, index=True, nullable=False)
    hash = Column(String(100), unique=True, nullable=False)
    parent_hash = Column(String(100), nullable=True)
    timestamp = Column(Integer, nullable=False)

    transactions = relationship("TrustLedgerTransaction", back_populates="block", cascade="all, delete-orphan")


class TrustLedgerTransaction(Base):
    __tablename__ = "trust_ledger_transactions"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("trust_ledger_blocks.id", ondelete="CASCADE"), nullable=False)
    txn_id = Column(String(100), unique=True, nullable=False)
    txn_type = Column(String(50), nullable=False) # 'round_anchor', 'smart_contract_deploy', etc.
    payload_json = Column(Text, nullable=False) # Complete transaction payload

    block = relationship("TrustLedgerBlock", back_populates="transactions")


# ── Patient Metrics & Transactions (Live Data Integration) ────────
class PatientMetrics(Base):
    __tablename__ = "patient_metrics"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    aqi = Column(Float, default=95.0)
    did_string = Column(String(255), nullable=True)
    last_sync = Column(DateTime(timezone=True), server_default=func.now())


class FedcoinTransaction(Base):
    __tablename__ = "fedcoin_transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)
    activity = Column(String(255), nullable=False)
    reward_amount = Column(String(50), nullable=False) # e.g. "+50 FC"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    wallet = relationship("Wallet")

# ── Web3 Patient Passports ───────────────────────────────────────
class PatientPassportNFT(Base):
    __tablename__ = "patient_passport_nfts"

    id = Column(Integer, primary_key=True, index=True)
    nft_identifier = Column(String(100), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    did_string = Column(String(255), nullable=False)
    token_uri = Column(Text, nullable=False)
    data_types = Column(Text, nullable=False)  # JSON string
    consent_active = Column(Boolean, default=True)
    earnings_fedcoin = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User")
