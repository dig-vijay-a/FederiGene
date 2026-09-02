"""
FederiGene — Secret Rotation Helper Script
===========================================
Run this script to generate new secure secrets and update your .env file.

Usage:
    python rotate_secrets.py           # Generate new secrets and print them
    python rotate_secrets.py --apply   # Generate AND write directly to .env
"""

import secrets
import os
import sys
import re
from datetime import datetime


def generate_jwt_secret():
    """Generate a cryptographically secure 64-char hex JWT signing key."""
    return secrets.token_hex(32)


def generate_hmac_secret():
    """Generate a cryptographically secure 64-char hex HMAC key."""
    return secrets.token_hex(32)


def generate_summary():
    """Print generated secrets and manual rotation instructions."""

    new_jwt_secret = generate_jwt_secret()
    new_hmac_secret = generate_hmac_secret()

    print("=" * 70)
    print("🔐 FederiGene Secret Rotation — Generated", datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("=" * 70)

    print()
    print("━━━ STEP 1: Update .env with these new values ━━━")
    print()
    print(f'  SECRET_KEY="{new_jwt_secret}"')
    print(f'  PLATFORM_HMAC_SECRET="{new_hmac_secret}"')
    print()

    print("━━━ STEP 2: Rotate Razorpay Keys (MANUAL) ━━━")
    print()
    print("  1. Go to: https://dashboard.razorpay.com/app/keys")
    print("  2. Click 'Regenerate Test Key' or 'Regenerate Live Key'")
    print("  3. Copy the new Key ID and Key Secret")
    print("  4. Update in .env:")
    print('     RAZORPAY_KEY_ID="rzp_test_YOUR_NEW_KEY_ID"')
    print('     RAZORPAY_KEY_SECRET="YOUR_NEW_KEY_SECRET"')
    print()

    print("━━━ STEP 3: Rotate Firebase Service Account (MANUAL) ━━━")
    print()
    print("  1. Go to: https://console.firebase.google.com/project/federigene/settings/serviceaccounts/adminsdk")
    print("  2. Click 'Generate New Private Key'")
    print("  3. Download the new JSON file")
    print("  4. Replace Backend/firebase-adminsdk.json with the new file")
    print("  5. DELETE the old key from the Firebase Console")
    print()

    print("━━━ STEP 4: Rotate Google Gemini API Key (MANUAL) ━━━")
    print()
    print("  1. Go to: https://aistudio.google.com/app/apikey")
    print("  2. Delete the current API key")
    print("  3. Create a new API key")
    print("  4. Update in .env:")
    print('     GEMINI_API_KEY="YOUR_NEW_GEMINI_KEY"')
    print()

    print("━━━ STEP 5: Rotate SMTP Password (MANUAL) ━━━")
    print()
    print("  1. Go to your email provider's security settings")
    print("     - Gmail: https://myaccount.google.com/apppasswords")
    print("     - Outlook: https://account.microsoft.com/security")
    print("  2. Revoke the current app password")
    print("  3. Generate a new app password")
    print("  4. Update in .env:")
    print('     MAIL_PASSWORD="YOUR_NEW_APP_PASSWORD"')
    print()

    print("━━━ STEP 6: Verify Everything Works ━━━")
    print()
    print("  Run: python -c \"from dotenv import load_dotenv; load_dotenv(); import os; print('SECRET_KEY set:', bool(os.getenv('SECRET_KEY'))); print('HMAC set:', bool(os.getenv('PLATFORM_HMAC_SECRET')))\"")
    print()
    print("=" * 70)

    return new_jwt_secret, new_hmac_secret


def apply_to_env(jwt_secret, hmac_secret):
    """Apply the generated secrets directly to the .env file."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")

    if not os.path.exists(env_path):
        print(f"❌ .env file not found at {env_path}")
        print("   Copy .env.example to .env first, then run this script again.")
        return False

    with open(env_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Replace SECRET_KEY
    content = re.sub(
        r'^SECRET_KEY=.*$',
        f'SECRET_KEY="{jwt_secret}"',
        content,
        flags=re.MULTILINE
    )

    # Replace or add PLATFORM_HMAC_SECRET
    if "PLATFORM_HMAC_SECRET" in content:
        content = re.sub(
            r'^PLATFORM_HMAC_SECRET=.*$',
            f'PLATFORM_HMAC_SECRET="{hmac_secret}"',
            content,
            flags=re.MULTILINE
        )
    else:
        content += f'\n\n# Federated Learning HMAC Secret (auto-generated)\nPLATFORM_HMAC_SECRET="{hmac_secret}"\n'

    if content != original:
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ Updated SECRET_KEY and PLATFORM_HMAC_SECRET in {env_path}")
        return True
    else:
        print("⚠️  No changes were made (keys may not have been found in .env)")
        return False


if __name__ == "__main__":
    jwt_secret, hmac_secret = generate_summary()

    if "--apply" in sys.argv:
        print()
        print("📝 Applying auto-generated secrets to .env...")
        apply_to_env(jwt_secret, hmac_secret)
        print()
        print("⚠️  Remember: You still need to manually rotate Razorpay, Firebase,")
        print("   Gemini, and SMTP keys using the steps above!")
