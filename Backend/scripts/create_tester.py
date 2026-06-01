import sys
import os
import getpass

# Add parent directory to sys.path to import from Backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from database.config import SessionLocal
    from models.auth_models import User
    from models.platform_models import OrgMembership
    from utils import security as auth_utils
except ImportError as e:
    print(f"Error: Could not import backend modules. {e}")
    sys.exit(1)

def create_tester():
    print("=== FederiGene Store Reviewer (Tester) Creator ===")
    
    email = input("Enter Tester Email: ").strip()
    username = input("Enter Tester Username: ").strip()
    password = getpass.getpass("Enter Tester Password: ").strip()

    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing:
            print(f"Error: User already exists.")
            return

        # Hash password
        password_hash = auth_utils.get_password_hash(password)

        # Create User with 'tester' role
        tester_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            totp_secret=auth_utils.generate_totp_secret(), # Hidden but generated
            role="tester",
            is_email_verified=True
        )

        db.add(tester_user)
        db.commit()
        db.refresh(tester_user)

        print("\n" + "="*50)
        print("SUCCESS: Store Reviewer account created!")
        print(f"Email:    {tester_user.email}")
        print(f"Username: {tester_user.username}")
        print(f"Role:     {tester_user.role}")
        print("-"*50)
        print("This account allows 1-STEP LOGIN (Password only).")
        print("Bypasses 2FA, Face Scan, and Fingerprint.")
        print("="*50)

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_tester()
