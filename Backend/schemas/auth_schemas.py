from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

# Security Question Schemas
class SecurityQuestionBase(BaseModel):
    id: int
    question_text: str

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: int
    answer: str

# Availability Check (Quick Validation)
class AvailabilityCheckRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class AvailabilityCheckResponse(BaseModel):
    available: bool
    detail: Optional[str] = None

# Registration
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str
    security_answers: List[AnswerSubmit] = Field(..., min_length=3, max_length=5)
    face_images_base64: Optional[List[str]] = Field(None, description="Optional face frames")
    webauthn_attestation: Optional[dict] = Field(None, description="Optional WebAuthn registration response")
    totp_secret: Optional[str] = None
    totp_uri: Optional[str] = None
    totp_code: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_email_verified: bool

    class Config:
        from_attributes = True

class RegisterResponse(BaseModel):
    user: UserResponse
    message: str
    totp_secret: str # Now mandatory
    totp_uri: str    # Now mandatory

class VerifyRegistrationTOTPRequest(BaseModel):
    username: str
    totp_code: str

# Generate WebAuthn Options (Pre-registration)
class WebAuthnRegisterOptionsRequest(BaseModel):
    username: str

# Login
class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class LoginResponse(BaseModel):
    message: str
    requires_step: int  # 2 for TOTP, 3 for Face, 4 for WebAuthn, 0 for Done
    temp_token: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    user: Optional[UserResponse] = None

class Verify2FARequest(BaseModel):
    temp_token: str
    totp_code: str

class VerifyFaceRequest(BaseModel):
    temp_token: str
    face_images_base64: List[str]

# WebAuthn Login Challenge Generation
class WebAuthnLoginOptionsRequest(BaseModel):
    temp_token: str

class VerifyFingerprintRequest(BaseModel):
    temp_token: str
    webauthn_assertion: dict

# Email Verification
class VerifyEmailRequest(BaseModel):
    token: str

# Password Recovery
class ForgotPasswordRequest(BaseModel):
    username_or_email: str

class VerifyOTPRequest(BaseModel):
    username_or_email: str
    otp_code: str

class SecurityQuestionChallenge(BaseModel):
    recovery_token: str
    questions: List[SecurityQuestionBase]

class VerifySecurityQuestionRequest(BaseModel):
    recovery_token: str
    question_id: int
    answer: str

class ResetPasswordRequest(BaseModel):
    password_reset_token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str
