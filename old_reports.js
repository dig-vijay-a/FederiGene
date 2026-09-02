const xlsx = require('xlsx');

// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// SHEET 1: Security Findings (27 real findings from SAST review)
// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const findings = [
  // CRITICAL
  { ID: 'CRIT-001', Severity: 'Critical', Type: 'Sensitive Data Exposure', File: 'Backend/.env', Endpoint: 'N/A', Description: 'Hardcoded production secrets (.env) committed to Git. Contains JWT secret, Razorpay live keys, SMTP password, Gemini API key.', Impact: 'Full authentication bypass, financial fraud, API abuse', Status: 'Open', Remediation: 'Rotate all keys, add .env to .gitignore, scrub Git history' },
  { ID: 'CRIT-002', Severity: 'Critical', Type: 'Hardcoded Private Key', File: 'Backend/firebase-adminsdk.json', Endpoint: 'N/A', Description: 'Firebase service account private key committed to repository.', Impact: 'Full Firebase project compromise, push notification abuse', Status: 'Open', Remediation: 'Rotate Firebase key, load from env var GOOGLE_APPLICATION_CREDENTIALS' },
  { ID: 'CRIT-003', Severity: 'Critical', Type: 'Hardcoded HMAC Secret', File: 'Backend/services/crypto_utils.py:10', Endpoint: 'N/A', Description: 'PLATFORM_HMAC_SECRET hardcoded in source code for federated learning integrity.', Impact: 'Model poisoning via forged HMAC signatures', Status: 'Open', Remediation: 'Move to environment variable or key management system' },
  { ID: 'CRIT-004', Severity: 'Critical', Type: 'Dangerous CORS', File: 'Backend/main.py:50-56', Endpoint: 'All endpoints', Description: 'Wildcard CORS allow_origins=["*"] with allow_methods=["*"] and allow_headers=["*"].', Impact: 'Cross-origin API abuse, data exfiltration from any website', Status: 'Open', Remediation: 'Restrict to specific frontend domains' },
  
  // HIGH
  { ID: 'HIGH-001', Severity: 'High', Type: 'Weak Crypto Key Default', File: 'Backend/utils/security.py:14', Endpoint: 'All JWT-protected', Description: 'JWT SECRET_KEY has a predictable default fallback value if env var is unset.', Impact: 'Full authentication bypass if deployed without env var', Status: 'Open', Remediation: 'Remove default, fail on startup if SECRET_KEY is not set' },
  { ID: 'HIGH-002', Severity: 'High', Type: 'Auth Bypass', File: 'Backend/controllers/auth_controller.py:157-171', Endpoint: 'POST /api/auth/login', Description: 'Admin and tester roles bypass all multi-factor authentication (TOTP, Face, Fingerprint).', Impact: 'Complete admin takeover with single-factor auth', Status: 'Open', Remediation: 'Enforce 2FA for all roles, especially privileged ones' },
  { ID: 'HIGH-003', Severity: 'High', Type: 'Missing Authentication', File: 'Backend/routes/license_routes.py:37', Endpoint: 'POST /api/license/create-razorpay-order', Description: 'Payment order creation endpoint has no authentication.', Impact: 'Unauthorized payment order creation, financial fraud', Status: 'Open', Remediation: 'Add Depends(get_current_user) decorator' },
  { ID: 'HIGH-004', Severity: 'High', Type: 'Information Disclosure', File: 'Backend/routes/auth_routes.py:22-24', Endpoint: 'GET /api/auth/pre-reg-totp', Description: 'TOTP secret generation for any email without authentication.', Impact: 'Resource abuse, social engineering', Status: 'Open', Remediation: 'Rate-limit and tie to registration session' },
  { ID: 'HIGH-005', Severity: 'High', Type: 'Session Management', File: 'Backend/utils/security.py:16', Endpoint: 'All JWT-protected', Description: 'JWT token lifetime is 12 hours (720 minutes).', Impact: 'Extended window for stolen token abuse', Status: 'Open', Remediation: 'Reduce to 30-60 minutes with refresh token mechanism' },
  { ID: 'HIGH-006', Severity: 'High', Type: 'Broken Access Control', File: 'Backend/routes/user_routes.py:210-216', Endpoint: 'GET /api/users/all', Description: 'All users list endpoint returns every user to any authenticated user.', Impact: 'Full user enumeration including emails and roles', Status: 'Open', Remediation: 'Restrict to admin roles, implement pagination' },
  { ID: 'HIGH-007', Severity: 'High', Type: 'Weak Password Policy', File: 'Backend/controllers/auth_controller.py:404-412', Endpoint: 'POST /api/auth/reset-password', Description: 'Password reset does not validate password strength.', Impact: 'Users can set weak passwords after reset', Status: 'Open', Remediation: 'Apply validate_password_strength() in reset flow' },
  
  // MEDIUM
  { ID: 'MED-001', Severity: 'Medium', Type: 'Information Leakage', File: 'Backend/controllers/auth_controller.py', Endpoint: 'Multiple auth endpoints', Description: 'Debug print() statements output OTP codes, admin bypass info to stdout/logs.', Impact: 'OTP leakage in server logs', Status: 'Open', Remediation: 'Replace print() with structured logging, remove OTP from output' },
  { ID: 'MED-002', Severity: 'Medium', Type: 'Sensitive Data in Logs', File: 'Backend/controllers/auth_controller.py:353', Endpoint: 'POST /api/auth/forgot-password', Description: 'Password reset OTP printed to console in plaintext.', Impact: 'Log access enables OTP interception', Status: 'Open', Remediation: 'Remove print statement, send OTP only via email' },
  { ID: 'MED-003', Severity: 'Medium', Type: 'Excessive Data Exposure', File: 'Backend/controllers/auth_controller.py:144-149', Endpoint: 'POST /api/auth/register', Description: 'Registration response includes TOTP secret and URI.', Impact: '2FA bypass if response is intercepted', Status: 'Open', Remediation: 'Show QR only during initial registration step' },
  { ID: 'MED-004', Severity: 'Medium', Type: 'Weak Cryptography', File: 'Backend/routes/license_routes.py:171', Endpoint: 'POST /api/license/request-upgrade', Description: 'License keys generated with MD5 hash (weak, deterministic).', Impact: 'Predictable license keys', Status: 'Open', Remediation: 'Use secrets.token_urlsafe() or SHA-256 with random salt' },
  { ID: 'MED-005', Severity: 'Medium', Type: 'Brute Force', File: 'Backend/routes/auth_routes.py', Endpoint: 'All auth endpoints', Description: 'No rate limiting on login, 2FA, OTP, or password reset endpoints.', Impact: 'Brute-force attacks on passwords and OTPs', Status: 'Open', Remediation: 'Implement slowapi rate limiting (5 attempts/min/IP)' },
  { ID: 'MED-006', Severity: 'Medium', Type: 'Broken Authentication', File: 'Backend/controllers/auth_controller.py:312-323', Endpoint: 'POST /api/auth/verify-fingerprint', Description: 'WebAuthn verification completely bypassed in code.', Impact: 'Step 4 of 4FA provides no security guarantee', Status: 'Open', Remediation: 'Implement proper WebAuthn assertion verification' },
  { ID: 'MED-007', Severity: 'Medium', Type: 'IDOR', File: 'Backend/routes/consent_routes.py:94-116', Endpoint: 'POST /api/platform/consent/{id}/revoke', Description: 'Consent revocation lacks patient ownership verification.', Impact: 'Any user can revoke any consent record', Status: 'Open', Remediation: 'Verify consent.patient_id == user.id' },
  { ID: 'MED-008', Severity: 'Medium', Type: 'IDOR', File: 'Backend/routes/consent_routes.py:118-141', Endpoint: 'POST /api/platform/consent/{id}/gdpr-delete', Description: 'GDPR deletion request lacks owner verification.', Impact: 'Any user can trigger GDPR deletion for any patient', Status: 'Open', Remediation: 'Verify consent.patient_id == user.id' },
  { ID: 'MED-009', Severity: 'Medium', Type: 'Missing Auth / IDOR', File: 'Backend/routes/marketplace_routes.py:97-102', Endpoint: 'GET /api/marketplace/wallet/{entity_id}', Description: 'Wallet balance endpoint has no authentication.', Impact: 'Financial data exposure for all users/orgs', Status: 'Open', Remediation: 'Add authentication and ownership verification' },
  { ID: 'MED-010', Severity: 'Medium', Type: 'Missing Authentication', File: 'Backend/routes/marketplace_routes.py:23-45', Endpoint: 'POST /api/marketplace/models/{id}/publish', Description: 'Model publishing endpoint requires no authentication.', Impact: 'Unauthenticated model metadata modification', Status: 'Open', Remediation: 'Add Depends(get_current_user) and ownership check' },
  
  // LOW
  { ID: 'LOW-001', Severity: 'Low', Type: 'Framework Deprecation', File: 'Backend/main.py:75', Endpoint: 'N/A', Description: 'Uses deprecated @app.on_event("startup") instead of lifespan.', Impact: 'May break on future FastAPI versions', Status: 'Open', Remediation: 'Migrate to lifespan async context manager' },
  { ID: 'LOW-002', Severity: 'Low', Type: 'Vulnerable Dependency', File: 'Backend/requirements.txt:7', Endpoint: 'N/A', Description: 'bcrypt pinned to old version 3.2.0.', Impact: 'Potential DoS or implementation bugs', Status: 'Open', Remediation: 'Upgrade to bcrypt>=4.0.0' },
  { ID: 'LOW-003', Severity: 'Low', Type: 'Insecure Default', File: 'Backend/database/config.py:11-14', Endpoint: 'N/A', Description: 'SQLite used as default database with no auth.', Impact: 'No database-level access control', Status: 'Open', Remediation: 'Use PostgreSQL/MySQL in production' },
  { ID: 'LOW-004', Severity: 'Low', Type: 'Missing Security Headers', File: 'Backend/main.py', Endpoint: 'All responses', Description: 'No X-Frame-Options, HSTS, CSP, X-Content-Type-Options headers.', Impact: 'Clickjacking, MIME sniffing attacks', Status: 'Open', Remediation: 'Add security headers middleware' },
  { ID: 'LOW-005', Severity: 'Low', Type: 'Container Security', File: 'Backend/Dockerfile', Endpoint: 'N/A', Description: 'Docker container runs as root user.', Impact: 'Container escape more severe', Status: 'Open', Remediation: 'Add non-root user in Dockerfile' },
  { ID: 'LOW-006', Severity: 'Low', Type: 'Configuration Error', File: 'Backend/main.py:119,126', Endpoint: '/api/marketplace/*', Description: 'marketplace_routes.router is mounted twice.', Impact: 'Duplicate route registration', Status: 'Open', Remediation: 'Remove duplicate include_router call' },
];

// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// SHEET 2: Endpoint Inventory (Complete API surface)
// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const endpoints = [
  // Root
  { Endpoint: '/', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'main.py', Module: 'Root' },
  { Endpoint: '/health', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'main.py', Module: 'Root' },
  { Endpoint: '/download-windows-app', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'main.py', Module: 'Root' },
  
  // Auth Routes
  { Endpoint: '/api/auth/security-questions', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/check-availability', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/webauthn-register-options', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/pre-reg-totp', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/register', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-registration-totp', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/login', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-2fa', Method: 'POST', AuthRequired: 'No (temp_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-face', Method: 'POST', AuthRequired: 'No (temp_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/webauthn-login-options', Method: 'POST', AuthRequired: 'No (temp_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-fingerprint', Method: 'POST', AuthRequired: 'No (temp_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-email', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/forgot-password', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/login-questions', Method: 'GET', AuthRequired: 'No (temp_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-questions-login', Method: 'POST', AuthRequired: 'No (temp_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-otp', Method: 'POST', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/verify-security-question', Method: 'POST', AuthRequired: 'No (recovery_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/reset-password', Method: 'POST', AuthRequired: 'No (reset_token)', ExpectedRoles: 'Public', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  { Endpoint: '/api/auth/change-password', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/auth_routes.py', Module: 'Auth' },
  
  // User Routes
  { Endpoint: '/api/users/me', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/user_routes.py', Module: 'Users' },
  { Endpoint: '/api/users/me/profile', Method: 'PUT', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/user_routes.py', Module: 'Users' },
  { Endpoint: '/api/users/me/avatar', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/user_routes.py', Module: 'Users' },
  { Endpoint: '/api/users/me/sessions', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/user_routes.py', Module: 'Users' },
  { Endpoint: '/api/users/me/sessions/{id}', Method: 'DELETE', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/user_routes.py', Module: 'Users' },
  { Endpoint: '/api/users/all', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any (SHOULD be admin only)', Controller: 'routes/user_routes.py', Module: 'Users' },
  
  // Platform Routes
  { Endpoint: '/api/platform/orgs/register', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/orgs', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/orgs/pending', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/orgs/approve', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/orgs/members', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Org members', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/orgs/members', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'hospital_admin', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/datasets', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Org members', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/datasets/{id}', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Org members / admin', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/datasets', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/training', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/training', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/training/{id}', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/training/{id}/start', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/training/{id}/submit', Method: 'POST', AuthRequired: 'API Key', ExpectedRoles: 'Hospital Node', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/models', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/models/{id}/evaluate', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/models/{id}/evaluations', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/audit-logs', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/dashboard/stats', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/keys', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'hospital_admin', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/keys', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/node/verify', Method: 'POST', AuthRequired: 'API Key', ExpectedRoles: 'Hospital Node', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  { Endpoint: '/api/platform/analytics/query', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/platform_routes.py', Module: 'Platform' },
  
  // Settings Routes
  { Endpoint: '/api/platform/org/settings', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin, hospital_admin', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  { Endpoint: '/api/platform/org/settings', Method: 'PUT', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin, hospital_admin', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  { Endpoint: '/api/platform/org/api-keys', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any org member', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  { Endpoint: '/api/platform/org/api-keys', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any org member', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  { Endpoint: '/api/platform/datasets/{id}/policies', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Dataset org member', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  { Endpoint: '/api/platform/datasets/{id}/policies', Method: 'PUT', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Dataset org member', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  { Endpoint: '/api/platform/security/keys', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin, hospital_admin', Controller: 'routes/settings_routes.py', Module: 'Settings' },
  
  // Chat Routes
  { Endpoint: '/api/chat/ask', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/chat_routes.py', Module: 'Chat' },
  { Endpoint: '/api/chat/contact', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/chat_routes.py', Module: 'Chat' },
  
  // Patient Routes
  { Endpoint: '/api/patient/fcm-token', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/patient_routes.py', Module: 'Patient' },
  { Endpoint: '/api/patient/dashboard', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/patient_routes.py', Module: 'Patient' },
  { Endpoint: '/api/patient/consents', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/patient_routes.py', Module: 'Patient' },
  { Endpoint: '/api/patient/consent/{id}/approve', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Patient owner', Controller: 'routes/patient_routes.py', Module: 'Patient' },
  { Endpoint: '/api/patient/consent/{id}/reject', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Patient owner', Controller: 'routes/patient_routes.py', Module: 'Patient' },
  { Endpoint: '/api/patient/earnings', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/patient_routes.py', Module: 'Patient' },
  
  // Consent Routes
  { Endpoint: '/api/platform/datasets/{id}/consent', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Org member / admin', Controller: 'routes/consent_routes.py', Module: 'Consent' },
  { Endpoint: '/api/platform/datasets/{id}/request-consent', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/consent_routes.py', Module: 'Consent' },
  { Endpoint: '/api/platform/consent/{id}/revoke', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any auth (SHOULD be owner)', Controller: 'routes/consent_routes.py', Module: 'Consent' },
  { Endpoint: '/api/platform/consent/{id}/gdpr-delete', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any auth (SHOULD be owner)', Controller: 'routes/consent_routes.py', Module: 'Consent' },
  
  // License Routes
  { Endpoint: '/api/license/create-razorpay-order', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/tiers', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/status', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Org member', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/request-upgrade', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin, hospital_admin', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/finalize-fedcoin-purchase', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/verify/{key}', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/sales-leads', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/sales-leads/{id}/respond', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/sales-leads/{id}/approve', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/sales-leads/{id}/invoice', Method: 'POST', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'platform_admin', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/public/invoice/{id}', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/public/invoice/{id}/checkout', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/license_routes.py', Module: 'License' },
  { Endpoint: '/api/license/public/invoice/{id}/finalize', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/license_routes.py', Module: 'License' },
  
  // Compliance Routes
  { Endpoint: '/api/compliance/audit', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/compliance_routes.py', Module: 'Compliance' },
  { Endpoint: '/api/compliance/audit/{id}', Method: 'GET', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/compliance_routes.py', Module: 'Compliance' },
  { Endpoint: '/api/compliance/frameworks', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/compliance_routes.py', Module: 'Compliance' },
  { Endpoint: '/api/compliance/report/{job_id}', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/compliance_routes.py', Module: 'Compliance' },
  { Endpoint: '/api/compliance/verify-model/{id}', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/compliance_routes.py', Module: 'Compliance' },
  
  // Marketplace Routes
  { Endpoint: '/api/marketplace/models/{id}/publish', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/marketplace_routes.py', Module: 'Marketplace' },
  { Endpoint: '/api/marketplace/catalog', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/marketplace_routes.py', Module: 'Marketplace' },
  { Endpoint: '/api/marketplace/models', Method: 'GET', AuthRequired: 'No', ExpectedRoles: 'Public', Controller: 'routes/marketplace_routes.py', Module: 'Marketplace' },
  { Endpoint: '/api/marketplace/my-wallet', Method: 'GET', AuthRequired: 'Yes (Bearer)', ExpectedRoles: 'Any authenticated', Controller: 'routes/marketplace_routes.py', Module: 'Marketplace' },
  { Endpoint: '/api/marketplace/wallet/{entity_id}', Method: 'GET', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/marketplace_routes.py', Module: 'Marketplace' },
  { Endpoint: '/api/marketplace/subscribe', Method: 'POST', AuthRequired: 'No (??????)', ExpectedRoles: 'Public', Controller: 'routes/marketplace_routes.py', Module: 'Marketplace' },
];

// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// SHEET 3: Dependency Vulnerabilities
// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const dependencies = [
  { Package: 'bcrypt', CurrentVersion: '3.2.0', LatestVersion: '4.2.x', Severity: 'Medium', Issue: 'Outdated; security patches in 4.x', Action: 'Upgrade to bcrypt>=4.0.0' },
  { Package: 'passlib[bcrypt]', CurrentVersion: '1.7.4', LatestVersion: '1.7.4 (EOL)', Severity: 'Low', Issue: 'Deprecated library, no longer maintained', Action: 'Migrate to bcrypt directly' },
  { Package: 'numpy', CurrentVersion: 'unpinned', LatestVersion: '2.1.x', Severity: 'Low', Issue: 'Unpinned dependency; non-reproducible builds', Action: 'Pin to specific version' },
  { Package: 'Pillow', CurrentVersion: 'unpinned', LatestVersion: '11.x', Severity: 'Medium', Issue: 'Historical CVE target for image parsing', Action: 'Pin to latest, validate inputs' },
  { Package: 'webauthn', CurrentVersion: 'unpinned', LatestVersion: '-', Severity: 'Low', Issue: 'Unpinned dependency', Action: 'Pin to specific version' },
  { Package: 'google-genai', CurrentVersion: 'unpinned', LatestVersion: '-', Severity: 'Low', Issue: 'Unpinned dependency', Action: 'Pin to specific version' },
  { Package: 'gunicorn', CurrentVersion: 'unpinned', LatestVersion: '23.x', Severity: 'Low', Issue: 'Unpinned dependency', Action: 'Pin to specific version' },
  { Package: 'torch', CurrentVersion: '>=2.0.0', LatestVersion: '2.5.x', Severity: 'Medium', Issue: 'Large package; check for known CVEs', Action: 'Update and audit' },
  { Package: 'opencv-python-headless', CurrentVersion: '>=4.9.0', LatestVersion: '4.10.x', Severity: 'Medium', Issue: 'Historical CVE target', Action: 'Update to latest' },
  { Package: 'python-multipart', CurrentVersion: '>=0.0.9', LatestVersion: '0.0.18', Severity: 'Low', Issue: 'Outdated, update recommended', Action: 'Update to latest' },
  { Package: 'deepface', CurrentVersion: '>=0.0.84', LatestVersion: '0.0.93', Severity: 'Low', Issue: 'Many transitive dependencies', Action: 'Update and audit deps' },
  { Package: 'websockets', CurrentVersion: '>=12.0', LatestVersion: '14.x', Severity: 'Low', Issue: 'Major version behind', Action: 'Update to latest' },
];

// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// SHEET 4: Risk Summary
// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const critCount = findings.filter(f => f.Severity === 'Critical').length;
const highCount = findings.filter(f => f.Severity === 'High').length;
const medCount = findings.filter(f => f.Severity === 'Medium').length;
const lowCount = findings.filter(f => f.Severity === 'Low').length;

const riskSummary = [
  { Metric: 'Assessment Date', Value: new Date().toLocaleDateString() },
  { Metric: 'Application', Value: 'FederiGene Backend API' },
  { Metric: 'Framework', Value: 'Python FastAPI' },
  { Metric: 'Total Findings', Value: findings.length },
  { Metric: 'Critical', Value: critCount },
  { Metric: 'High', Value: highCount },
  { Metric: 'Medium', Value: medCount },
  { Metric: 'Low', Value: lowCount },
  { Metric: 'Overall Security Score', Value: '32/100' },
  { Metric: 'OWASP Top 10 Violations', Value: '6/10' },
  { Metric: 'Total API Endpoints Discovered', Value: endpoints.length },
  { Metric: 'Unauthenticated Sensitive Endpoints', Value: endpoints.filter(e => e.AuthRequired.includes('??????')).length },
  { Metric: 'Direct Dependencies', Value: '27' },
  { Metric: 'Dependencies with Issues', Value: dependencies.length },
  { Metric: 'Recommendation', Value: 'CRITICAL ??? Immediate remediation required before production deployment' },
];

// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
// CREATE WORKBOOK
// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const wb = xlsx.utils.book_new();

// Sheet 1: Security Findings
const wsFinding = xlsx.utils.json_to_sheet(findings);
wsFinding['!cols'] = [
  { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 45 }, { wch: 45 },
  { wch: 80 }, { wch: 50 }, { wch: 8 }, { wch: 60 }
];
xlsx.utils.book_append_sheet(wb, wsFinding, 'Security Findings');

// Sheet 2: Endpoint Inventory
const wsEndpoint = xlsx.utils.json_to_sheet(endpoints);
wsEndpoint['!cols'] = [
  { wch: 55 }, { wch: 8 }, { wch: 20 }, { wch: 35 }, { wch: 35 }, { wch: 15 }
];
xlsx.utils.book_append_sheet(wb, wsEndpoint, 'Endpoint Inventory');

// Sheet 3: Dependency Vulnerabilities
const wsDep = xlsx.utils.json_to_sheet(dependencies);
wsDep['!cols'] = [
  { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 50 }, { wch: 35 }
];
xlsx.utils.book_append_sheet(wb, wsDep, 'Dependency Vulnerabilities');

// Sheet 4: Risk Summary
const wsRisk = xlsx.utils.json_to_sheet(riskSummary);
wsRisk['!cols'] = [
  { wch: 40 }, { wch: 80 }
];
xlsx.utils.book_append_sheet(wb, wsRisk, 'Risk Summary');

// Write files
xlsx.writeFile(wb, 'findings.xlsx');
console.log('??? findings.xlsx generated successfully');

// Also generate endpoint-inventory.xlsx as a standalone file
const wbEndpoints = xlsx.utils.book_new();
const wsEP2 = xlsx.utils.json_to_sheet(endpoints);
wsEP2['!cols'] = [
  { wch: 55 }, { wch: 8 }, { wch: 20 }, { wch: 35 }, { wch: 35 }, { wch: 15 }
];
xlsx.utils.book_append_sheet(wbEndpoints, wsEP2, 'Endpoint Inventory');
xlsx.writeFile(wbEndpoints, 'endpoint-inventory.xlsx');
console.log('??? endpoint-inventory.xlsx generated successfully');
