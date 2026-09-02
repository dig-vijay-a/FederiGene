import secrets
import base64
import os

def generate_secret(length=32) -> str:
    """Generate a cryptographically secure random secret."""
    return secrets.token_hex(length)

def generate_base64_secret(length=32) -> str:
    """Generate a base64 encoded secure secret (good for HMAC keys)."""
    return base64.b64encode(secrets.token_bytes(length)).decode('utf-8')

def main():
    print("=" * 60)
    print("Production Secret Generator")
    print("=" * 60)
    print("\nCopy the following values into your production environment variables (or .env file for local testing):\n")
    
    # Generate JWT Secret
    jwt_secret = generate_secret(64)
    print(f"SECRET_KEY={jwt_secret}")
    
    # Generate HMAC Secret
    hmac_secret = generate_secret(32)
    print(f"PLATFORM_HMAC_SECRET={hmac_secret}")
    
    # Generate WebAuthn RP ID (default example)
    print("WEBAUTHN_RP_ID=federigene.com")
    print("WEBAUTHN_RP_NAME=\"FederiGene Platform\"")
    print("FRONTEND_URL=https://federigene.com")
    
    print("\n" + "=" * 60)
    print("WARNING: Never commit these secrets to version control.")
    print("Make sure your .env file is added to .gitignore!")
    print("=" * 60)

if __name__ == "__main__":
    main()
