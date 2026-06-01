import os
import base64
from dotenv import load_dotenv
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    AuthenticatorAttachment
)
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes

load_dotenv()

# WebAuthn Configuration
RP_ID = os.getenv("RP_ID", "172.22.12.159")
RP_NAME = "FederiGene Secure Health Network"
EXPECTED_ORIGIN = os.getenv("EXPECTED_ORIGIN", f"https://{RP_ID}:5173")

def get_registration_options(username: str, user_id: str):
    """Generates options for the browser to create a new Passkey/Fingerprint."""
    challenge = os.urandom(32)
    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id.encode("utf-8"),
        user_name=username,
        challenge=challenge,
        attestation=AttestationConveyancePreference.NONE,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            user_verification=UserVerificationRequirement.REQUIRED
        ),
    )
    return options, bytes_to_base64url(challenge)

def verify_registration(credential_response: dict, expected_challenge: str):
    """Verifies the signed registration payload from the browser."""
    try:
        verification = verify_registration_response(
            credential=credential_response,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_rp_id=RP_ID,
            expected_origin=EXPECTED_ORIGIN,
            require_user_verification=True
        )
        return verification
    except Exception as e:
        print(f"[WebAuthn] Registration Verify Error: {e}")
        return None

def get_login_options(credential_id: str = None):
    """Generates the challenge for a fingerprint login."""
    challenge = os.urandom(32)
    allow_credentials = []
    if credential_id:
        allow_credentials = [{
            "id": base64url_to_bytes(credential_id),
            "type": "public-key"
        }]
        
    options = generate_authentication_options(
        rp_id=RP_ID,
        challenge=challenge,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.REQUIRED
    )
    return options, bytes_to_base64url(challenge)

def verify_login(credential_response: dict, expected_challenge: str, stored_public_key: bytes, stored_sign_count: int):
    """Verifies the fingerprint login signature."""
    try:
        verification = verify_authentication_response(
            credential=credential_response,
            expected_challenge=base64url_to_bytes(expected_challenge),
            expected_rp_id=RP_ID,
            expected_origin=EXPECTED_ORIGIN,
            credential_public_key=stored_public_key,
            credential_current_sign_count=stored_sign_count,
            require_user_verification=True
        )
        return verification
    except Exception as e:
        print(f"[WebAuthn] Login Verify Error: {e}")
        return None
