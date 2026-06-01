from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from database.config import get_db
from models.auth_models import User, UserSession
from models.platform_models import OrgMembership, Organization, OrgStatus, Wallet
from utils import security as auth_utils
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import uuid

router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_user(db: Session = Depends(get_db), authorization: str = Header(None)):
    """Extract current user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = auth_utils.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Check if session has been revoked
    jti = payload.get("jti")
    if jti:
        session = db.query(UserSession).filter(
            UserSession.token_jti == jti, UserSession.is_active == True
        ).first()
        if not session:
            raise HTTPException(status_code=401, detail="Session has been revoked")
        # Update last_active timestamp
        session.last_active_at = datetime.utcnow()
        db.commit()
    
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_current_jti(authorization: str = Header(None)):
    """Extract JTI from current token."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = auth_utils.decode_token(token)
    return payload.get("jti") if payload else None


@router.get("/me")
def get_my_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db), authorization: str = Header(None)):
    """Returns the currently authenticated user's profile with role and org info."""
    # Get org membership
    membership = db.query(OrgMembership).filter(
        OrgMembership.user_id == user.id, 
        OrgMembership.is_primary == True
    ).first()
    
    org_data = None
    if membership:
        org = db.query(Organization).filter(Organization.id == membership.org_id).first()
        if org:
            org_data = {
                "id": org.id,
                "name": org.name,
                "org_type": org.org_type,
                "status": getattr(org.status, 'value', org.status) if org.status else None,
                "subscription_tier": getattr(org.subscription_tier, 'value', org.subscription_tier) if org.subscription_tier else "free",
                "license_key": org.license_key
            }

    # Determine entity_id for wallet
    if org_data:
        entity_id = f"ORG_{org_data['id']}"
    else:
        entity_id = f"USER_{user.id}"
        
    wallet = db.query(Wallet).filter(Wallet.owner_id == entity_id).first()
    fedcoin_balance = wallet.balance_fedcoin if wallet else 0.0

    # Get current JTI
    current_jti = get_current_jti(authorization)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "display_name": user.display_name or user.username,
        "bio": user.bio or "",
        "avatar_url": user.avatar_url,
        "role": user.role or "researcher",
        "is_email_verified": user.is_email_verified,
        "organization": org_data,
        "fedcoin_balance": fedcoin_balance,
        "current_jti": current_jti,
    }


# --- Profile Update ---
class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None

@router.put("/me/profile")
def update_profile(data: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update display name and bio."""
    if data.display_name is not None:
        user.display_name = data.display_name.strip()[:100]
    if data.bio is not None:
        user.bio = data.bio.strip()[:500]
    
    db.commit()
    db.refresh(user)
    return {
        "message": "Profile updated successfully",
        "display_name": user.display_name,
        "bio": user.bio
    }


# --- Avatar Upload ---
@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Upload a profile photo."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File must be JPEG, PNG, WebP, or GIF")
    
    # Limit file size (2MB)
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 2MB.")
    
    # Generate unique filename
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Delete old avatar if exists
    if user.avatar_url:
        old_path = os.path.join(UPLOAD_DIR, os.path.basename(user.avatar_url))
        if os.path.exists(old_path):
            os.remove(old_path)
    
    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Update user record
    user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    
    return {"message": "Avatar uploaded", "avatar_url": user.avatar_url}


# --- Active Sessions ---
@router.get("/me/sessions")
def get_active_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db), authorization: str = Header(None)):
    """List all active sessions for the current user."""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).order_by(UserSession.last_active_at.desc()).all()
    
    current_jti = get_current_jti(authorization)
    
    return [{
        "id": s.id,
        "device_info": s.device_info or "Unknown Device",
        "ip_address": s.ip_address or "Unknown",
        "is_current": s.token_jti == current_jti,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "last_active_at": s.last_active_at.isoformat() if s.last_active_at else None,
    } for s in sessions]


@router.delete("/me/sessions/{session_id}")
def revoke_session(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db), authorization: str = Header(None)):
    """Revoke a specific session."""
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == user.id,
        UserSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Don't allow revoking current session
    current_jti = get_current_jti(authorization)
    if session.token_jti == current_jti:
        raise HTTPException(status_code=400, detail="Cannot revoke your current session. Use logout instead.")
    
    session.is_active = False
    session.revoked_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Session revoked successfully"}


@router.get("/all")
def get_all_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns a basic list of all platform users (for inviting to teams)."""
    # In a real app, this should be searchable/paginated. 
    # For this prototype, we return basic info so Hospital Admins can invite them.
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "role": u.role} for u in users]

