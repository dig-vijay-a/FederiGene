from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from database.config import get_db
from schemas import auth_schemas as schemas
from controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/security-questions", response_model=list[schemas.SecurityQuestionBase])
def get_security_questions(db: Session = Depends(get_db)):
    return auth_controller.get_security_questions(db)

@router.post("/check-availability", response_model=schemas.AvailabilityCheckResponse)
def check_availability(req: schemas.AvailabilityCheckRequest, db: Session = Depends(get_db)):
    return auth_controller.check_availability(req, db)

# WebAuthn Registration Options (called BEFORE submitting the registration form)
@router.post("/webauthn-register-options")
def webauthn_register_options(req: schemas.WebAuthnRegisterOptionsRequest, db: Session = Depends(get_db)):
    return auth_controller.generate_webauthn_register_options(req, db)

@router.get("/pre-reg-totp")
def get_pre_reg_totp(email: str):
    return auth_controller.get_pre_reg_totp(email)

@router.post("/register", response_model=schemas.RegisterResponse)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return auth_controller.register_user(user, background_tasks, db)

@router.post("/verify-registration-totp")
def verify_registration_totp(req: schemas.VerifyRegistrationTOTPRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_registration_totp(req, db)

# ---- 4-STEP LOGIN PIPELINE ----

# Step 1: Password
@router.post("/login", response_model=schemas.LoginResponse)
def login(req: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    return auth_controller.login_user(req, request, db)

# Step 2: TOTP / Google Authenticator
@router.post("/verify-2fa", response_model=schemas.LoginResponse)
def verify_2fa(req: schemas.Verify2FARequest, request: Request, db: Session = Depends(get_db)):
    return auth_controller.verify_2fa(req, request, db)

# Step 3: Face Recognition (Webcam)
@router.post("/verify-face", response_model=schemas.LoginResponse)
def verify_face(req: schemas.VerifyFaceRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_face(req, db)

# Step 4: Fingerprint / WebAuthn
@router.post("/webauthn-login-options")
def webauthn_login_options(req: schemas.WebAuthnLoginOptionsRequest, db: Session = Depends(get_db)):
    return auth_controller.generate_webauthn_login_options(req, db)

@router.post("/verify-fingerprint", response_model=schemas.LoginResponse)
def verify_fingerprint(req: schemas.VerifyFingerprintRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_fingerprint(req, db)

# ---- PASSWORD RECOVERY ----

@router.post("/verify-email")
def verify_email(req: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_email(req, db)

@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_controller.handle_forgot_password(req, db)

@router.get("/login-questions")
def get_login_questions(temp_token: str, db: Session = Depends(get_db)):
    return auth_controller.get_my_questions_login(temp_token, db)

@router.post("/verify-questions-login")
def verify_questions_login(req: schemas.VerifySecurityQuestionRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_security_questions_login(req, db)

@router.post("/verify-otp", response_model=schemas.SecurityQuestionChallenge)
def verify_otp(req: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_otp_logic(req, db)

@router.post("/verify-security-question")
def verify_security_question(req: schemas.VerifySecurityQuestionRequest, db: Session = Depends(get_db)):
    return auth_controller.verify_security_question_logic(req, db)

@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    return auth_controller.reset_password_logic(req, db)

from models.auth_models import User
from routes.user_routes import get_current_user

@router.post("/change-password")
def change_password(req: schemas.ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return auth_controller.change_password_logic(user, req, db)
