from datetime import datetime, timedelta
import jwt
import pyotp
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

import bcrypt
import hashlib
import base64

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 720
TEMP_TOKEN_EXPIRE_MINUTES = 5

def validate_password_strength(password: str):
    """
    Enforces strict password rules:
    - Min 8 chars
    - At least 1 uppercase
    - At least 1 lowercase
    - At least 1 number
    - At least 1 special character
    """
    import re
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[ !@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character (!@#$%^&* etc)."
    return True, ""

def _get_bcrypt_input(password: str) -> bytes:
    # Pre-hash with SHA256 and base64 encode to bypass bcrypt's 72-byte limit
    sha256_hash = hashlib.sha256(password.encode('utf-8')).digest()
    return base64.b64encode(sha256_hash)

def verify_password(plain_password: str, hashed_password: str):
    try:
        return bcrypt.checkpw(
            _get_bcrypt_input(plain_password), 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        print(f"Bcrypt verification error: {e}")
        return False

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(_get_bcrypt_input(password), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "jti": jti})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti

def create_temp_token(email: str, reason: str):
    """ Used for 2FA, OTP verification holding state """
    expire = datetime.utcnow() + timedelta(minutes=TEMP_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "reason": reason, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def generate_totp_secret():
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str, issuer_name: str = "FederiGene"):
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer_name)

def verify_totp(secret: str, code: str):
    totp = pyotp.TOTP(secret)
    return totp.verify(code)
