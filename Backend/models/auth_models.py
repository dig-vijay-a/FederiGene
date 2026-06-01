from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, TEXT, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_email_verified = Column(Boolean, default=False)
    totp_secret = Column(String(32), nullable=False) # Now mandatory, never null
    
    # Profile Fields
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=False, server_default="")
    display_name = Column(String(100), nullable=True)  # Auto-composed from first + last name
    bio = Column(Text, nullable=True)  # Professional description
    avatar_url = Column(String(500), nullable=True)  # Path or URL to profile photo
    
    # Biometric Step 3: Face Recognition
    face_encoding_json = Column(TEXT, nullable=True) # JSON list of 478 normalized landmarks
    
    # Push Notifications
    fcm_token = Column(String(500), nullable=True)
    
    # Biometric Step 4: WebAuthn / Fingerprint
    webauthn_credential_id = Column(String(255), nullable=True)
    webauthn_public_key = Column(TEXT, nullable=True) # Use TEXT for long public keys
    webauthn_sign_count = Column(Integer, default=0)
    current_webauthn_challenge = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Role-Based Access Control
    role = Column(String(50), default="researcher")  # platform_admin, hospital_admin, researcher, data_custodian, auditor

    security_answers = relationship("UserSecurityAnswer", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    memberships = relationship("OrgMembership", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")

class SecurityQuestion(Base):
    __tablename__ = "security_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String(255), nullable=False)

    answers = relationship("UserSecurityAnswer", back_populates="question")

class UserSecurityAnswer(Base):
    __tablename__ = "user_security_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("security_questions.id"), nullable=False)
    answer_hash = Column(String(255), nullable=False)

    user = relationship("User", back_populates="security_answers")
    question = relationship("SecurityQuestion", back_populates="answers")

class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), index=True, nullable=False)
    purpose = Column(String(50), nullable=False) # E.g., 'EMAIL_VERIFICATION', 'PASSWORD_RESET_OTP'
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="verification_tokens")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_jti = Column(String(255), unique=True, index=True, nullable=False)  # JWT ID for revocation
    device_info = Column(String(255), nullable=True)  # e.g. "Windows 11 - Chrome"
    ip_address = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="sessions")
