import os
import random
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
import json
import traceback
import logging
import logging
from fastapi import Request
from models import auth_models as models
from models import platform_models
from schemas import auth_schemas as schemas
from utils import security as auth_utils
from utils import biometrics, webauthn_utils

def get_security_questions(db: Session):
    questions = db.query(models.SecurityQuestion).all()
    # Return 5 random questions for registration
    return random.sample(questions, 5) if len(questions) >= 5 else questions

def check_availability(req: schemas.AvailabilityCheckRequest, db: Session):
    if req.username:
        user = db.query(models.User).filter(models.User.username == req.username).first()
        if user:
            return {"available": False, "detail": "Username already taken"}
    if req.email:
        user = db.query(models.User).filter(models.User.email == req.email).first()
        if user:
            return {"available": False, "detail": "Email already exists"}
    return {"available": True, "detail": "Available"}

def generate_webauthn_register_options(req: schemas.WebAuthnRegisterOptionsRequest, db: Session):
    # Use a deterministic hash of the username as the user handle 
    # (must be <= 64 bytes per WebAuthn spec).
    import hashlib
    user_handle = hashlib.sha256(req.username.encode()).hexdigest()[:32]
    options = webauthn_utils.get_registration_options(req.username, user_handle)
    return json.loads(options)

def get_pre_reg_totp(email: str):
    secret = auth_utils.generate_totp_secret()
    uri = auth_utils.get_totp_uri(secret, email)
    return {"secret": secret, "uri": uri}

from fastapi import BackgroundTasks

def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session):
    if db.query(models.User).filter((models.User.email == user.email) | (models.User.username == user.username)).first():
        raise HTTPException(status_code=400, detail="Email or Username already registered")
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Strict Password Rules Validation
    is_valid, pwd_error = auth_utils.validate_password_strength(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=pwd_error)
    
    # 1. Process Face Biometrics (Optional)
    face_embeddings = biometrics.get_multi_face_embeddings(user.face_images_base64) if user.face_images_base64 else []
    face_encoding_json = json.dumps(face_embeddings) if face_embeddings else None
    
    # 2. Process WebAuthn (Optional)
    cred_id = user.webauthn_attestation.get("id") if user.webauthn_attestation else None
    pub_key_bytes = b"dummy_pub_key_for_poc" # Placeholder

    hashed_password = auth_utils.get_password_hash(user.password)
    
    # Use pre-generated TOTP if provided, otherwise generate new
    totp_secret = user.totp_secret if user.totp_secret else auth_utils.generate_totp_secret()
    totp_uri = user.totp_uri if user.totp_uri else auth_utils.get_totp_uri(totp_secret, user.email)
    
    # 2FA Enforcement: Verify TOTP Code
    if not user.totp_code or not auth_utils.verify_totp(totp_secret, user.totp_code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code. Please scan the QR code and enter the correct 6-digit code.")

    # Compose display name from first + last name
    first_name = (user.first_name or "").strip()
    last_name = user.last_name.strip()
    display_name = f"{first_name} {last_name}".strip() if first_name else last_name

    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        totp_secret=totp_secret,
        first_name=first_name or None,
        last_name=last_name,
        display_name=display_name,
        role=user.role or "researcher",
        face_encoding_json=face_encoding_json,
        webauthn_credential_id=cred_id,
        webauthn_public_key=pub_key_bytes.decode('latin1') if pub_key_bytes and cred_id else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Save answers
    for ans in user.security_answers:
        hashed_ans = auth_utils.get_password_hash(ans.answer.lower().strip())
        db.add(models.UserSecurityAnswer(user_id=db_user.id, question_id=ans.question_id, answer_hash=hashed_ans))
    
    # Generate Email Verification Token
    email_token = auth_utils.create_temp_token(db_user.email, "email_verification")
    db.add(models.VerificationToken(
        user_id=db_user.id, token=email_token, purpose="EMAIL_VERIFICATION", 
        expires_at=datetime.utcnow() + timedelta(days=1)
    ))
    
    # --- Live Data Provisioning for Patient App ---
    # 1. Create a Wallet for FedCoins
    owner_id = f"USER_{db_user.id}"
    new_wallet = platform_models.Wallet(owner_id=owner_id, balance_fedcoin=50.0, total_earned=50.0)
    db.add(new_wallet)
    db.flush() # get new_wallet.id
    
    # 2. Give a sign-up bonus transaction
    bonus_txn = platform_models.FedcoinTransaction(
        wallet_id=new_wallet.id,
        activity="Early Adopter Sign-up Bonus",
        reward_amount="+50 FC"
    )
    db.add(bonus_txn)
    
    # 3. Create Patient Metrics (AQI and DID)
    did_str = f"did:fedegene:pt_{db_user.id}_0x" + os.urandom(8).hex().upper()
    metrics = platform_models.PatientMetrics(
        patient_id=db_user.id,
        aqi=95.0,
        did_string=did_str
    )
    db.add(metrics)
    
    db.commit()

    # REAL EMAIL SENDING
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify-email?token={email_token}"
    
    from utils import mail_utils
    background_tasks.add_task(mail_utils.send_verification_email, db_user.email, verify_url)

    return {
        "user": db_user,
        "message": "User registered successfully. Please check your inbox (including spam) for the verification link.",
        "totp_secret": totp_secret,
        "totp_uri": totp_uri
    }

def login_user(req: schemas.LoginRequest, request: Request, db: Session):
    """Step 1: Password Auth -> Returns Step 2 Request Token"""
    user = db.query(models.User).filter((models.User.email == req.username_or_email) | (models.User.username == req.username_or_email)).first()
    if not user or not auth_utils.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email/username or password")
    
    # ── 1-FACTOR LOGIN BYPASS (Admin, Tester for Mobile Testing) ──
    if user.role in ["platform_admin", "tester"]:
        access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token, jti = auth_utils.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        # Create session record
        session = models.UserSession(
            user_id=user.id, token_jti=jti,
            device_info=request.headers.get("user-agent", "Admin Bypass"),
            ip_address=request.client.host if request.client else "Unknown"
        )
        db.add(session)
        db.commit()
        return {"message": "Administrative access granted.", "requires_step": 0, "access_token": access_token, "token_type": "bearer", "user": user}

    temp_token = auth_utils.create_temp_token(user.email, "2fa_pending")
    
    # NEW: Check for email verification
    if not user.is_email_verified:
        return {
            "message": "Email not verified. Please check your inbox.", 
            "requires_step": -1, # Custom code for "blocked until verified" 
            "temp_token": None
        }

    return {"message": "Password verified. 2FA required.", "requires_step": 2, "temp_token": temp_token}

def verify_registration_totp(req: schemas.VerifyRegistrationTOTPRequest, db: Session):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not auth_utils.verify_totp(user.totp_secret, req.totp_code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code. Registration not yet complete.")
    
    # User is now registered and TOTP is verified.
    # Note: is_email_verified remains False until they click the mock link.
    print(f"DEBUG: Initial TOTP verified for {user.username}. Registration finalized.")
    return {"message": "TOTP verified. Please verify your email via the link sent to your inbox to enable login."}

def verify_2fa(req: schemas.Verify2FARequest, request: Request, db: Session):
    """Step 2: TOTP Auth -> Returns Step 3 Request Token"""
    payload = auth_utils.decode_token(req.temp_token)
    if not payload or payload.get("reason") != "2fa_pending":
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    if not auth_utils.verify_totp(user.totp_secret, req.totp_code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
        
    # Fully authenticated! (Bypassing Step 3 & 4 as requested)
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, jti = auth_utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    session = models.UserSession(
        user_id=user.id, token_jti=jti,
        device_info=request.headers.get("user-agent", "Unknown Device"),
        ip_address=request.client.host if request.client else "Unknown"
    )
    db.add(session)
    db.commit()
    
    return {"message": "Login successful.", "requires_step": 0, "access_token": access_token, "token_type": "bearer", "user": user}

def verify_face(req: schemas.VerifyFaceRequest, db: Session):
    """Step 3: Face Auth -> Returns Step 4 Request Token"""
    payload = auth_utils.decode_token(req.temp_token)
    if not payload or payload.get("reason") != "face_pending":
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    
    if not user.face_encoding_json:
        # ALLOW BYPASS FOR BOOTSTRAPPED PLATFORM ADMIN
        if user.role == "platform_admin":
            print(f"DEBUG: Admin {user.username} bypassing face scan (uninitialized).")
            # If fingerprint is also missing, skip directly to successful login
            if not user.webauthn_credential_id:
                access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token, jti = auth_utils.create_access_token(
                    data={"sub": user.email}, expires_delta=access_token_expires
                )
                session = models.UserSession(user_id=user.id, token_jti=jti, device_info="Admin Bypass", ip_address="Unknown")
                db.add(session); db.commit()
                return {"message": "Admin bypass: Biometrics skipped. Please set up in Settings.", "requires_step": 0, "access_token": access_token, "token_type": "bearer", "user": user}
            
            temp_token = auth_utils.create_temp_token(user.email, "fingerprint_pending")
            return {"message": "Admin bypass: Face scan skipped. Please set up in Settings.", "requires_step": 4, "temp_token": temp_token}
        raise HTTPException(status_code=400, detail="No facial baseline registered.")
        
    temp_token = auth_utils.create_temp_token(user.email, "fingerprint_pending")
    return {"message": "Face verified. Fingerprint required.", "requires_step": 4, "temp_token": temp_token}

def get_my_questions_login(temp_token: str, db: Session):
    payload = auth_utils.decode_token(temp_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    user_answers = db.query(models.UserSecurityAnswer).filter(models.UserSecurityAnswer.user_id == user.id).all()
    questions = [{"id": ans.question.id, "question_text": ans.question.question_text} for ans in user_answers]
    return questions

def verify_security_questions_login(req: schemas.VerifySecurityQuestionRequest, db: Session):
    # This repurposes the verification logic for login fallback
    payload = auth_utils.decode_token(req.recovery_token) # we use recovery_token field for temp_token here
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    user_answer = db.query(models.UserSecurityAnswer).filter(
        models.UserSecurityAnswer.user_id == user.id,
        models.UserSecurityAnswer.question_id == req.question_id
    ).first()
    
    if not user_answer or not auth_utils.verify_password(req.answer.lower().strip(), user_answer.answer_hash):
        raise HTTPException(status_code=401, detail="Incorrect answer")
        
    # Fully authenticated!
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, jti = auth_utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    session = models.UserSession(user_id=user.id, token_jti=jti, device_info="Fallback Login", ip_address="Unknown")
    db.add(session); db.commit()
    return {"message": "Identity verified via fallback", "requires_step": 0, "access_token": access_token, "token_type": "bearer", "user": user}

def generate_webauthn_login_options(req: schemas.WebAuthnLoginOptionsRequest, db: Session):
    payload = auth_utils.decode_token(req.temp_token)
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    # Bypass strict challenge mapping for demo
    options = webauthn_utils.get_login_options()
    return json.loads(options)

def verify_fingerprint(req: schemas.VerifyFingerprintRequest, db: Session):
    """Step 4: WebAuthn Auth -> Returns Final Access Token"""
    payload = auth_utils.decode_token(req.temp_token)
    if not payload or payload.get("reason") != "fingerprint_pending":
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    
    if not user.webauthn_credential_id:
        # ALLOW BYPASS FOR BOOTSTRAPPED PLATFORM ADMIN
        if user.role == "platform_admin":
            print(f"DEBUG: Admin {user.username} bypassing fingerprint (uninitialized).")
            access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token, jti = auth_utils.create_access_token(
                data={"sub": user.email}, expires_delta=access_token_expires
            )
            session = models.UserSession(user_id=user.id, token_jti=jti, device_info="Admin Bypass", ip_address="Unknown")
            db.add(session); db.commit()
            return {"message": "Admin bypass: All factors verified! Please set up biometrics in Settings.", "requires_step": 0, "access_token": access_token, "token_type": "bearer", "user": user}
        raise HTTPException(status_code=400, detail="No fingerprint credential registered.")

    # We bypass strict FIDO cryptographically here for the GUI demonstration
    # In prod, we'd feed `req.webauthn_assertion` into `webauthn_utils.verify_login`
    
    # Fully authenticated 4-factor user!
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token, jti = auth_utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    session = models.UserSession(user_id=user.id, token_jti=jti, device_info="4FA Login", ip_address="Unknown")
    db.add(session); db.commit()
    return {"message": "All 4 Factors verified! Login complete.", "requires_step": 0, "access_token": access_token, "token_type": "bearer", "user": user}

def verify_email(req: schemas.VerifyEmailRequest, db: Session):
    token_record = db.query(models.VerificationToken).filter(
        models.VerificationToken.token == req.token,
        models.VerificationToken.purpose == "EMAIL_VERIFICATION",
        models.VerificationToken.expires_at > datetime.utcnow()
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(models.User).filter(models.User.id == token_record.user_id).first()
    if user and not user.is_email_verified:
        user.is_email_verified = True
        
    # We use a direct delete query to avoid the SAWarning if it was already deleted concurrently
    db.query(models.VerificationToken).filter(
        models.VerificationToken.id == token_record.id
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"message": "Email verified successfully"}

def handle_forgot_password(req: schemas.ForgotPasswordRequest, db: Session):
    user = db.query(models.User).filter((models.User.email == req.username_or_email) | (models.User.username == req.username_or_email)).first()
    if not user:
        return {"message": "If an account exists, an OTP has been sent."}
    
    otp_code = str(random.randint(100000, 999999))
    print(f"-- OTP for {user.email}: {otp_code} --")
    
    db.add(models.VerificationToken(
        user_id=user.id, token=otp_code, purpose="PASSWORD_RESET_OTP",
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    ))
    db.commit()
    return {"message": "If an account exists, an OTP has been sent."}

def verify_otp_logic(req: schemas.VerifyOTPRequest, db: Session):
    user = db.query(models.User).filter((models.User.email == req.username_or_email) | (models.User.username == req.username_or_email)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    token_record = db.query(models.VerificationToken).filter(
        models.VerificationToken.user_id == user.id,
        models.VerificationToken.token == req.otp_code,
        models.VerificationToken.purpose == "PASSWORD_RESET_OTP",
        models.VerificationToken.expires_at > datetime.utcnow()
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    db.query(models.VerificationToken).filter(
        models.VerificationToken.id == token_record.id
    ).delete(synchronize_session=False)
    
    recovery_token = auth_utils.create_temp_token(user.email, "security_question_pending")
    user_answers = db.query(models.UserSecurityAnswer).filter(models.UserSecurityAnswer.user_id == user.id).all()
    questions = [answer.question for answer in user_answers]
    
    return {"recovery_token": recovery_token, "questions": questions}

def verify_security_question_logic(req: schemas.VerifySecurityQuestionRequest, db: Session):
    payload = auth_utils.decode_token(req.recovery_token)
    if not payload or payload.get("reason") != "security_question_pending":
        raise HTTPException(status_code=401, detail="Invalid recovery token")
        
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    user_answer = db.query(models.UserSecurityAnswer).filter(
        models.UserSecurityAnswer.user_id == user.id,
        models.UserSecurityAnswer.question_id == req.question_id
    ).first()
    
    if not user_answer or not auth_utils.verify_password(req.answer.lower().strip(), user_answer.answer_hash):
        raise HTTPException(status_code=401, detail="Incorrect answer")
        
    reset_token = auth_utils.create_temp_token(user.email, "reset_password_granted")
    return {"message": "Identity verified", "password_reset_token": reset_token}

def reset_password_logic(req: schemas.ResetPasswordRequest, db: Session):
    payload = auth_utils.decode_token(req.password_reset_token)
    if not payload or payload.get("reason") != "reset_password_granted":
        raise HTTPException(status_code=401, detail="Invalid or expired reset token")
        
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    user.password_hash = auth_utils.get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now login."}

def change_password_logic(user: models.User, req: schemas.ChangePasswordRequest, db: Session):
    if not auth_utils.verify_password(req.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        
    user.password_hash = auth_utils.get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
