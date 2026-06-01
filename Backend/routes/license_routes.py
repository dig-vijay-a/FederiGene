from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import hashlib
import os
import re
try:
    import razorpay
except ImportError:
    razorpay = None

from database.config import get_db
from models.auth_models import User
from models.platform_models import Organization, SubscriptionTier, AuditLog, OrgMembership, SalesLead, SalesLeadStatus
from routes.user_routes import get_current_user
from utils.mail_utils import send_sales_lead_notification, send_sales_lead_approved, send_sales_lead_rejected, send_sales_lead_invoice

router = APIRouter(prefix="/api/license", tags=["Commercial Licensing"])

# Initialize Razorpay Client gracefully
import logging
logger = logging.getLogger(__name__)
try:
    razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', 'dummy'), os.environ.get('RAZORPAY_KEY_SECRET', 'dummy')))
except Exception as e:
    logger.warning("Failed to initialize Razorpay Client: %s", str(e))
    razorpay_client = None

FEDCOIN_PACKS = {
    "starter_fc": {"name": "Starter FedCoin Pack", "amount": 1000, "price": "₹499"},
    "pro_fc": {"name": "Professional FedCoin Pack", "amount": 5000, "price": "₹1999"},
    "inst_fc": {"name": "Institutional FedCoin Pack", "amount": 25000, "price": "₹8999"}
}

@router.post("/create-razorpay-order")
def create_razorpay_order(tier: str, currency: str = "INR"):
    """Generates a Razorpay Order ID securely from the backend for Tiers or FedCoin Packs."""
    # Check if it's a subscription tier or a FedCoin pack
    if tier in TIER_DETAILS:
        price_str = TIER_DETAILS[tier]["price"]
    elif tier in FEDCOIN_PACKS:
        price_str = FEDCOIN_PACKS[tier]["price"]
    else:
        raise HTTPException(status_code=400, detail="Invalid item requested")
        
    amount_raw = int(re.sub(r'[^0-9]', '', str(price_str)))
    if amount_raw == 0:
        return {"order_id": None}
        
    amount_in_paise = amount_raw * 100 
    
    if not razorpay_client:
        return {"order_id": None, "error": "Razorpay client not configured on server"}
        
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": f"FG_{tier}_{int(datetime.utcnow().timestamp())}"
        }
        order = razorpay_client.order.create(data=order_data)
        return {"order_id": order["id"], "amount": amount_in_paise, "currency": currency, "key_id": os.environ.get('RAZORPAY_KEY_ID')}
    except Exception as e:
        return {"order_id": None, "error": str(e)}

TIER_DETAILS = {
    "free": {
        "name": "Community / Free",
        "price": "₹0 / mo",
        "features": ["1 active training job", "Standard aggregation", "Public marketplace access"],
        "max_jobs": 1
    },
    "research": {
        "name": "Research Pro",
        "price": "₹1 / mo",
        "features": ["5 active training jobs", "Advanced Byzantine robust aggregation", "ZKP attestation support", "Priority support"],
        "max_jobs": 5
    },
    "professional": {
        "name": "Enterprise Professional",
        "price": "₹2 / mo",
        "features": ["Unlimited jobs", "Homomorphic Encryption (Full)", "Regulatory compliance auto-reports", "Custom SHAP explainability"],
        "max_jobs": 999
    },
    "institutional": {
        "name": "Institutional Hub",
        "price": "Contact Sales",
        "features": ["White-labeled node SDK", "Custom secure enclave (TEE) integration", "On-premise deployment support", "24/7 dedicated engineering"],
        "max_jobs": 9999
    }
}

@router.post("/finalize-fedcoin-purchase")
def finalize_fedcoin_purchase(
    pack_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds purchased FedCoins to the user's balance after successful payment."""
    if pack_id not in FEDCOIN_PACKS:
        raise HTTPException(status_code=400, detail="Invalid FedCoin pack")
        
    pack = FEDCOIN_PACKS[pack_id]
    user.fedcoin_balance = (user.fedcoin_balance or 0) + pack["amount"]
    
    db.add(AuditLog(
        user_id=user.id,
        org_id=None,
        action="fedcoin_purchased",
        resource_type="user",
        resource_id=user.id,
        details=json.dumps({"pack_id": pack_id, "amount": pack["amount"]})
    ))
    db.commit()
    return {"message": f"Success! {pack['amount']} FedCoins have been added to your balance.", "new_balance": user.fedcoin_balance}

@router.get("/tiers")
def list_subscription_tiers():
    """Returns details for all available subscription tiers."""
    return TIER_DETAILS

@router.get("/status")
def get_license_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the current subscription status for the user's organization."""
    membership = db.query(OrgMembership).filter(OrgMembership.user_id == user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of an organization")
        
    org = db.query(Organization).filter(Organization.id == membership.org_id).first()
    
    return {
        "org_name": org.name,
        "current_tier": org.subscription_tier,
        "expires_at": org.subscription_expires_at,
        "details": TIER_DETAILS.get(org.subscription_tier.value, {})
    }

@router.post("/request-upgrade")
def request_tier_upgrade(
    tier: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Workflow for requesting a subscription upgrade."""
    if user.role not in ["platform_admin", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Only Hospital Admins can modify enterprise subscriptions")
        
    if tier not in TIER_DETAILS:
        raise HTTPException(status_code=400, detail="Invalid tier requested")
        
    membership = db.query(OrgMembership).filter(OrgMembership.user_id == user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of an organization")
        
    org = db.query(Organization).filter(Organization.id == membership.org_id).first()
    
    # For simulation, we'll auto-approve for Research, Professional, and Free
    if tier in ["free", "research", "professional"]:
        org.subscription_tier = SubscriptionTier[tier.upper()]
        
        if tier == "free":
            org.subscription_expires_at = None
            org.license_key = None
            msg = "Your organization has been successfully downgraded to the Community / Free plan."
        else:
            org.subscription_expires_at = datetime.utcnow() + timedelta(days=365)
            org.license_key = f"FG-{tier.upper()[:3]}-{hashlib.md5(org.name.encode()).hexdigest()[:12].upper()}"
            msg = f"Payment Successful! You are now subscribed to the {tier.capitalize()} tier."
            
        db.add(AuditLog(
            user_id=user.id,
            org_id=org.id,
            action="subscription_updated",
            resource_type="organization",
            resource_id=org.id,
            details=json.dumps({"tier": tier})
        ))
        db.commit()
        return {"message": msg, "license_key": org.license_key}
    
    # Institutional tier requires manual sales team approval
    # Check for existing open lead
    existing_lead = db.query(SalesLead).filter(
        SalesLead.org_id == org.id,
        SalesLead.status.in_([SalesLeadStatus.NEW, SalesLeadStatus.CONTACTED])
    ).first()
    if existing_lead:
        return {"message": "Your enterprise inquiry is already being reviewed by our sales team. We will contact you shortly.", "status": "already_pending"}

    lead = SalesLead(
        user_id=user.id,
        org_id=org.id,
        requested_tier=tier
    )
    db.add(lead)
    db.add(AuditLog(
        user_id=user.id,
        org_id=org.id,
        action="enterprise_inquiry_submitted",
        resource_type="sales_lead",
        details=json.dumps({"requested_tier": tier})
    ))
    db.commit()
    
    # Send email notification to sales team (non-blocking)
    try:
        sales_email = os.environ.get('SALES_EMAIL', 'sales@federigene.com')
        send_sales_lead_notification(sales_email, org.name, user.username, user.email)
    except Exception as e:
        logger.warning("Failed to send sales lead email: %s", str(e))
    
    return {"message": "Your enterprise inquiry has been submitted! Our sales team will contact you within 24 hours.", "status": "pending_review"}

@router.get("/verify/{license_key}")
def verify_license(license_key: str, db: Session = Depends(get_db)):
    """Public verification endpoint for license keys."""
    org = db.query(Organization).filter(Organization.license_key == license_key).first()
    if not org:
        raise HTTPException(status_code=404, detail="Invalid license key")
        
    if org.subscription_expires_at and org.subscription_expires_at < datetime.utcnow():
        return {"status": "expired", "org": org.name}
        
    return {
        "status": "active",
        "org": org.name,
        "tier": org.subscription_tier,
        "valid_until": org.subscription_expires_at
    }


# ── Sales Lead Management (Admin Only) ────────────────────────────
@router.get("/sales-leads")
def list_sales_leads(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Platform admin: list all enterprise sales inquiries."""
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admin only")
    
    leads = db.query(SalesLead).order_by(SalesLead.created_at.desc()).all()
    return [{
        "id": l.id,
        "org_name": l.organization.name if l.organization else "Unknown",
        "org_id": l.org_id,
        "requester_name": l.requester.username if l.requester else "Unknown",
        "requester_email": l.requester.email if l.requester else "",
        "requested_tier": l.requested_tier,
        "status": l.status.value,
        "custom_price": l.custom_price,
        "invoice_id": l.invoice_id,
        "admin_notes": l.admin_notes,
        "created_at": str(l.created_at),
        "resolved_at": str(l.resolved_at) if l.resolved_at else None
    } for l in leads]


from pydantic import BaseModel
from typing import Optional

class SalesLeadResponseRequest(BaseModel):
    status: str  # contacted, rejected
    admin_notes: Optional[str] = None

class InvoiceGenerateRequest(BaseModel):
    amount: float
    description: Optional[str] = None


@router.post("/sales-leads/{lead_id}/respond")
def respond_to_sales_lead(
    lead_id: int,
    req: SalesLeadResponseRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Platform admin: update the status and notes on a sales lead."""
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admin only")
    
    lead = db.query(SalesLead).filter(SalesLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Sales lead not found")
    
    if req.status not in ["contacted", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'contacted' or 'rejected'")
    
    lead.status = SalesLeadStatus(req.status)
    if req.admin_notes:
        lead.admin_notes = req.admin_notes
    if req.status == "rejected":
        lead.resolved_at = datetime.utcnow()
        lead.resolved_by = user.id
    
    db.commit()

    # Send rejection email to the requester
    if req.status == "rejected":
        try:
            requester = db.query(User).filter(User.id == lead.user_id).first()
            org = db.query(Organization).filter(Organization.id == lead.org_id).first()
            if requester and org:
                send_sales_lead_rejected(requester.email, org.name, req.admin_notes or "")
        except Exception as e:
            logger.warning("Failed to send rejection email: %s", str(e))
    
    return {"message": f"Lead status updated to '{req.status}'"}


@router.post("/sales-leads/{lead_id}/approve")
def approve_sales_lead(
    lead_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Platform admin: approve a sales lead and auto-upgrade the organization."""
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admin only")
    
    lead = db.query(SalesLead).filter(SalesLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Sales lead not found")
    
    if lead.status == SalesLeadStatus.APPROVED:
        raise HTTPException(status_code=400, detail="This lead has already been approved")
    
    # Upgrade the organization to Institutional tier
    org = db.query(Organization).filter(Organization.id == lead.org_id).first()
    org.subscription_tier = SubscriptionTier.INSTITUTIONAL
    org.subscription_expires_at = datetime.utcnow() + timedelta(days=365)
    org.license_key = f"FG-INS-{hashlib.md5(org.name.encode()).hexdigest()[:12].upper()}"
    
    lead.status = SalesLeadStatus.APPROVED
    lead.resolved_at = datetime.utcnow()
    lead.resolved_by = user.id
    
    db.add(AuditLog(
        user_id=user.id,
        org_id=org.id,
        action="enterprise_inquiry_approved",
        resource_type="sales_lead",
        resource_id=lead.id,
        details=json.dumps({"tier": "institutional", "license_key": org.license_key})
    ))
    db.commit()
    
    # Send approval email to the requester
    try:
        requester = db.query(User).filter(User.id == lead.user_id).first()
        if requester:
            send_sales_lead_approved(requester.email, org.name, org.license_key)
    except Exception as e:
        logger.warning("Failed to send approval email: %s", str(e))
    
    return {"message": f"'{org.name}' has been upgraded to Institutional Hub. Confirmation email sent.", "license_key": org.license_key}


@router.post("/sales-leads/{lead_id}/invoice")
def generate_sales_lead_invoice(
    lead_id: int,
    req: InvoiceGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Platform admin: set a custom price and email an invoice link to the customer."""
    if user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admin only")
    
    lead = db.query(SalesLead).filter(SalesLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Sales lead not found")
        
    lead.custom_price = req.amount
    # Generate a unique slug for the payment page
    lead.invoice_id = hashlib.sha256(f"{lead_id}-{datetime.utcnow().timestamp()}".encode()).hexdigest()[:16]
    lead.status = SalesLeadStatus.CONTACTED
    
    if req.description:
        lead.admin_notes = f"[Invoice Sent: ₹{req.amount}] {req.description}"
    
    db.commit()
    
    # Prepend origin from environment for absolute email link.
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    payment_url = f"{frontend_url}/billing/invoice/{lead.invoice_id}"
    
    send_sales_lead_invoice(
        recipient_email=lead.requester.email,
        org_name=lead.organization.name,
        amount=req.amount,
        payment_url=payment_url 
    )
    
    return {"message": "Invoice generated and emailed.", "invoice_id": lead.invoice_id}


@router.get("/public/invoice/{invoice_id}")
def get_public_invoice_details(invoice_id: str, db: Session = Depends(get_db)):
    """Publicly accessible endpoint (via email link) to see invoice details."""
    lead = db.query(SalesLead).filter(SalesLead.invoice_id == invoice_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return {
        "org_name": lead.organization.name,
        "amount": lead.custom_price,
        "tier": lead.requested_tier,
        "status": lead.status.value,
        "requester": lead.requester.username
    }


@router.post("/public/invoice/{invoice_id}/checkout")
def create_invoice_checkout(invoice_id: str, db: Session = Depends(get_db)):
    """Generates a Razorpay order for a custom invoice amount."""
    lead = db.query(SalesLead).filter(SalesLead.invoice_id == invoice_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if not lead.custom_price:
        raise HTTPException(status_code=400, detail="No price set for this invoice")

    if not razorpay_client:
        return {"order_id": None, "error": "Razorpay client not configured"}

    amount_paise = int(lead.custom_price * 100)
    try:
        order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"INV_{lead.id}"
        })
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": os.environ.get('RAZORPAY_KEY_ID')
        }
    except Exception as e:
        return {"error": str(e)}


@router.post("/public/invoice/{invoice_id}/finalize")
def finalize_invoice_payment(invoice_id: str, db: Session = Depends(get_db)):
    """Upgrades the organization once the custom invoice is paid."""
    lead = db.query(SalesLead).filter(SalesLead.invoice_id == invoice_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    org = lead.organization
    org.subscription_tier = SubscriptionTier.INSTITUTIONAL
    org.subscription_expires_at = datetime.utcnow() + timedelta(days=365)
    
    # Generate enterprise license key
    org.license_key = f"FG-INS-{hashlib.md5(org.name.encode()).hexdigest()[:12].upper()}"
    
    lead.status = SalesLeadStatus.APPROVED
    lead.resolved_at = datetime.utcnow()
    # Note: resolved_by is None as it was a public action, but we can set to lead.requester.id
    lead.resolved_by = lead.user_id 

    db.add(AuditLog(
        user_id=lead.user_id,
        org_id=org.id,
        action="invoice_paid_upgrade",
        resource_type="organization",
        resource_id=org.id,
        details=json.dumps({"amount": lead.custom_price, "invoice_id": invoice_id})
    ))
    
    db.commit()
    
    # Send confirmation email
    send_sales_lead_approved(lead.requester.email, org.name, org.license_key)
    
    return {"message": "Payment confirmed! Organization upgraded to Institutional Hub."}
