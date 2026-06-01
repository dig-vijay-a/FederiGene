import sys
import os
import getpass
import json

# Add parent directory to sys.path to import from Backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database.config import SessionLocal
    from models.auth_models import User
    from models.platform_models import OrgMembership # Need to import to avoid relationship error
    from utils import security as auth_utils
except ImportError as e:
    print(f"Error: Could not import backend modules. Ensure you are running this from the Backend directory. {e}")
    sys.exit(1)

def bootstrap_admin():
    print("=== FederiGene Platform Admin Bootstrapper ===")
    
    email = input("Enter Admin Email: ").strip()
    username = input("Enter Admin Username: ").strip()
    password = getpass.getpass("Enter Admin Password: ").strip()
    confirm_password = getpass.getpass("Confirm Password: ").strip()

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    if len(password) < 8:
        print("Error: Password must be at least 8 characters.")
        return

    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing:
            print(f"Error: User with email {email} or username {username} already exists.")
            return

        # Generate TOTP Secret
        totp_secret = auth_utils.generate_totp_secret()
        totp_uri = auth_utils.get_totp_uri(totp_secret, email)
        
        # Hash password
        password_hash = auth_utils.get_password_hash(password)

        # Create User
        # Note: We leave face_encoding_json and webauthn fields None to trigger the first-time bypass
        admin_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            totp_secret=totp_secret,
            role="platform_admin",
            is_email_verified=True,
            face_encoding_json=None,
            webauthn_credential_id=None,
            webauthn_public_key=None
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("\n" + "="*50)
        print("SUCCESS: Platform Admin created successfully!")
        print(f"ID:       {admin_user.id}")
        print(f"Email:    {admin_user.email}")
        print(f"Username: {admin_user.username}")
        print(f"Role:     {admin_user.role}")
        print("-"*50)
        print("This account now supports 1-STEP LOGIN (Password only).")
        print("You can still add 2FA/Biometrics later in Settings.")
        print("="*50)
        print("NOTE: Since biometrics are not set yet, a one-time bypass is allowed for your first login.")
        print("Please visit 'Account Settings' immediately after logging in to enroll your face and fingerprint.")
        print("="*50)

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_admin()
