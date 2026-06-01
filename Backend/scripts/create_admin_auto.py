import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.config import SessionLocal
from models.auth_models import User
from models.platform_models import OrgMembership
from utils import security as auth_utils

def create_admin():
    email = "admin@federigene.com"
    username = "admin"
    password = "adminpassword123"

    db = SessionLocal()
    try:
        existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
        if existing:
            print(f"Error: User {username} already exists.")
            return

        totp_secret = auth_utils.generate_totp_secret()
        password_hash = auth_utils.get_password_hash(password)

        admin_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            totp_secret=totp_secret,
            role="platform_admin",
            is_email_verified=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"SUCCESS: Platform Admin created successfully! Email: {email}, Username: {username}, Password: {password}")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
