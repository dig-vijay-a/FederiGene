import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Force load latest .env
load_dotenv(override=True)

MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
MAIL_SERVER = os.environ.get("MAIL_SERVER")
try:
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
except ValueError:
    MAIL_PORT = 465
MAIL_FROM = os.environ.get("MAIL_FROM", "admin@federigene.com")

def send_email(subject: str, recipient: str, html_content: str):
    """Sends an HTML email using SMTP."""
    
    # DEBUG: Help ensure it's not a parsing issue
    if not MAIL_PASSWORD:
        print("\n[SKIP EMAIL] MAIL_PASSWORD is None. .env is not loading correctly.")
        return False
        
    if "your_smtp_password_here" in MAIL_PASSWORD:
        print(f"\n[SKIP EMAIL] Password is still the placeholder. Content would be sent to: {recipient}\n")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"FederiGene Support <{MAIL_FROM}>"
        msg["To"] = recipient

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Use SMTP_SSL for port 465, otherwise standard SMTP + starttls (587)
        if MAIL_PORT == 465:
            with smtplib.SMTP_SSL(MAIL_SERVER, MAIL_PORT) as server:
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.sendmail(MAIL_FROM, recipient, msg.as_string())
        else:
            with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
                server.starttls()
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.sendmail(MAIL_FROM, recipient, msg.as_string())
        
        return True
    except Exception as e:
        print(f"FAILED TO SEND EMAIL: {e}")
        return False

def send_verification_email(recipient_email: str, verify_url: str):
    """Sends a verification email to a new user."""
    subject = "Verify Your FederiGene Account"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb;">Welcome to FederiGene!</h2>
                <p>Hello,</p>
                <p>Thank you for registering on the FederiGene Privacy-Preserving Federated Learning Platform.</p>
                <p>To finalize your registration and enable your 4-factor login, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verify_url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p><a href="{verify_url}">{verify_url}</a></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8rem; color: #777;">This is an automated system message. Please do not reply directly to this email.</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, recipient_email, html_content)


def send_sales_lead_rejected(recipient_email: str, org_name: str, reason: str = ""):
    """Notifies the user that their enterprise upgrade request has been declined."""
    subject = "Update on Your FederiGene Enterprise Inquiry"
    reason_block = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6B46C1;">Enterprise Inquiry Update</h2>
                <p>Thank you for your interest in the <strong>Institutional Hub</strong> tier for <strong>{org_name}</strong>.</p>
                <p>After careful review, we are unable to approve this upgrade request at this time.</p>
                {reason_block}
                <p>We encourage you to explore our other tiers, or reach out directly to discuss alternative arrangements.</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="mailto:sales@federigene.com" style="background-color: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Sales Team</a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8rem; color: #777;">FederiGene Enterprise — Automated Notification</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, recipient_email, html_content)


def send_sales_lead_notification(admin_email: str, org_name: str, requester_name: str, requester_email: str):
    """Notifies the admin/sales team that a new enterprise inquiry has been submitted."""
    subject = f"🚀 New Enterprise Sales Lead: {org_name}"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6B46C1;">New Enterprise Sales Inquiry</h2>
                <p>A new Institutional Hub upgrade request has been submitted:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Organization</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{org_name}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Requester</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{requester_name}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{requester_email}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Tier Requested</td><td style="padding: 8px;">Institutional Hub</td></tr>
                </table>
                <p>Please log into the <strong>Admin Panel → Sales Leads</strong> section to review and respond.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8rem; color: #777;">FederiGene Enterprise Sales Pipeline — Automated Notification</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, admin_email, html_content)


def send_sales_lead_approved(recipient_email: str, org_name: str, license_key: str):
    """Notifies the user that their enterprise upgrade has been approved."""
    subject = "✅ Your FederiGene Institutional Hub Access is Approved!"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #22c55e;">Institutional Hub — Approved ✅</h2>
                <p>Great news! Your organization <strong>{org_name}</strong> has been upgraded to the <strong>Institutional Hub</strong> tier.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: #555;">Your License Key</p>
                    <code style="font-size: 1.2rem; font-weight: bold; color: #166534;">{license_key}</code>
                </div>
                <p>You now have access to:</p>
                <ul>
                    <li>White-labeled node SDK</li>
                    <li>Custom secure enclave (TEE) integration</li>
                    <li>On-premise deployment support</li>
                    <li>24/7 dedicated engineering</li>
                </ul>
                <p>If you have any questions, reply to this email or contact your account manager.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8rem; color: #777;">FederiGene Enterprise — Automated Notification</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, recipient_email, html_content)


def send_sales_lead_invoice(recipient_email: str, org_name: str, amount: float, payment_url: str):
    """Sends a custom invoice/payment link email to an enterprise customer."""
    subject = f"Invoice: Custom Institutional Hub Upgrade for {org_name}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6B46C1;">Custom Enterprise Invoice</h2>
                <p>Dear {org_name} Team,</p>
                <p>Following our recent discussion, we have generated a custom invoice for your organization's upgrade to the <strong>Institutional Hub</strong>.</p>
                
                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Negotiated Amount:</strong> ₹{amount:,.2f}</p>
                    <p style="margin: 10px 0 0 0;"><strong>Subscription Tier:</strong> Institutional Hub (Enterprise Edition)</p>
                </div>
                
                <p>To complete your upgrade and unlock all enterprise features (including White-labeling and TEE integration), please click the button below to proceed to our secure payment gateway:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{payment_url}" style="background-color: #6B46C1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Pay Invoice & Upgrade Now
                    </a>
                </div>
                
                <p>If you have any questions or require a formal PDF invoice for your records, please reply to this email.</p>
                <p>Best regards,<br/>FederiGene Enterprise Sales Team</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8rem; color: #777;">FederiGene Enterprise — Automated Notification</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject, recipient_email, html_content)


def send_support_email(user_email: str, user_name: str, subject: str, description: str):
    """Sends a contact support email to the admin/info address."""
    info_email = os.environ.get("INFO_EMAIL", "info@federigene.com")
    admin_subject = f"Support Ticket: {subject} (from {user_name})"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #6B46C1;">New Support Request</h2>
                <p><strong>From:</strong> {user_name} ({user_email})</p>
                <p><strong>Subject:</strong> {subject}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>Description/Inquiry:</strong></p>
                <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 4px;">{description}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 0.9em; color: #777;">Sent from the FederiGene Chat Agent.</p>
            </div>
        </body>
    </html>
    """
    return send_email(subject=admin_subject, recipient=info_email, html_content=html_content)
