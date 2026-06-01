import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../utils/api';
import './Auth.css';

const DEFAULT_QUESTIONS = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite book?",
    "What high school did you attend?",
    "What was your childhood nickname?",
    "What is the name of the road you grew up on?"
];

const TERMS_CONTENT = `
### 1. PLATFORM OVERVIEW AND ACCEPTANCE
By registering for a FederiGene account, you agree to be legally bound by these Terms and Conditions. FederiGene provides a Federated Learning (FL) platform for genomic research.

### 2. INTELLECTUAL PROPERTY AND LICENSING
- **FederiGene Infrastructure:** All platform code and architectural designs are the exclusive property of FederiGene Labs.
- **User Data:** Users retain 100% ownership of the raw genomic data processed on local nodes.
- **Derived Insights:** Model weights and global aggregations are jointly owned by the participating consortium members.

### 3. PAYMENT, SUBSCRIPTIONS, AND REFUNDS
- **Subscription Services:** Access is provided on a subscription basis via **Razorpay**.
- **No-Refund Policy:** Due to high compute costs, FederiGene does not offer refunds once a billing cycle has commenced.

### 4. DATA PRIVACY AND SOVEREIGNTY
- **Zero-Knowledge Architecture:** Raw data never leaves your institution's firewall.
- **User Responsibility:** You are responsible for ensuring HIPAA/GDPR compliance and patient consent.

### 5. MULTI-FACTOR SECURITY (MFA)
Your account is protected by Password, Security Questions, and TOTP (Google Authenticator).
- You agree to maintain the confidentiality of your credentials.
`;

export default function Register() {
    usePageTitle('Register');
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [regStep, setRegStep] = useState(1);  // 1 = Details, 2 = TOTP Setup, 3 = Success
    const [formData, setFormData] = useState({ username: '', first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
    const [availability, setAvailability] = useState({ username: null, email: null });
    const [availLoading, setAvailLoading] = useState({ username: false, email: false });
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState([
        { question_id: '', answer: '' },
        { question_id: '', answer: '' },
        { question_id: '', answer: '' }
    ]);

    const [qrCodeData, setQrCodeData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [totpCode, setTotpCode] = useState('');

    // Terms & Conditions State
    const [showTerms, setShowTerms] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const termsScrollRef = useRef<any>(null);

    useEffect(() => {
        api.get('/auth/security-questions')
            .then(res => setQuestions(res.data))
            .catch(() => setQuestions(DEFAULT_QUESTIONS.map((q, i) => ({ id: i + 1, question_text: q }))));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setAvailability(prev => ({ ...prev, [name]: null }));
    };

    const checkAvailability = async (field, value) => {
        if (!value || value.length < 3) return;
        setAvailLoading(prev => ({ ...prev, [field]: true }));
        try {
            const res = await api.post('/auth/check-availability', { [field]: value });
            setAvailability(prev => ({ ...prev, [field]: res.data.available }));
            if (!res.data.available) showToast(res.data.detail, 'error');
        } catch (err) {
            console.error("Availability check failed", err);
        } finally {
            setAvailLoading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleAnswerChange = (index, field, value) => {
        const updated = [...answers];
        updated[index][field] = value;
        setAnswers(updated);
    };

    const handleTermsScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 10) setScrolledToBottom(true);
    };

    const handleFormNext = async (e) => {
        e.preventDefault();
        
        // 1. Basic Agreement & Matching
        if (!termsAgreed) { showToast('You must agree to the Terms and Conditions.', 'error'); return; }
        if (formData.password !== formData.confirm_password) { showToast('Passwords do not match.', 'error'); return; }
        
        // --- STRICT PASSWORD RULES (FRONTEND) ---
        const password = formData.password;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < 8) { showToast('Password must be at least 8 characters long.', 'error'); return; }
        if (!hasUpper) { showToast('Password must contain at least one uppercase letter.', 'error'); return; }
        if (!hasLower) { showToast('Password must contain at least one lowercase letter.', 'error'); return; }
        if (!hasNumber) { showToast('Password must contain at least one number.', 'error'); return; }
        if (!hasSpecial) { showToast('Password must contain at least one special character (@, #, $, etc.).', 'error'); return; }
        // ----------------------------------------

        // 2. Specific Availability Checks
        if (availability.username === false) { showToast('This username is already taken. Please choose another.', 'error'); return; }
        if (availability.email === false) { showToast('This email is already registered. Try logging in.', 'error'); return; }
        
        // 3. Field Completeness
        if (!formData.username.trim()) { showToast('Username is required.', 'error'); return; }
        if (!formData.email.trim()) { showToast('Email address is required.', 'error'); return; }
        if (!formData.last_name.trim()) { showToast('Last name is required for researcher verification.', 'error'); return; }
        
        // 4. Security Questions
        if (answers.filter(a => a.question_id && a.answer.trim()).length < 3) {
            showToast('Please answer all 3 security questions for account recovery.', 'error'); return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/auth/pre-reg-totp?email=${formData.email}`);
            setQrCodeData(res.data);
            setRegStep(2);
        } catch (err) {
            showToast("Failed to generate security vault.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                first_name: formData.first_name.trim() || null,
                last_name: formData.last_name.trim(),
                security_answers: answers.filter(a => a.question_id && a.answer.trim()).map(a => ({
                    question_id: parseInt(a.question_id),
                    answer: a.answer
                })),
                role: 'researcher',
                totp_secret: qrCodeData?.secret,
                totp_uri: qrCodeData?.uri,
                totp_code: totpCode,
                face_images_base64: [],
                webauthn_attestation: null
            };
            await api.post('/auth/register', payload);
            showToast('Registration complete! Please verify your email.', 'success');
            setRegStep(3);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Registration failed.', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-container">
            <div className="glass-card auth-card">
                <div className="auth-logo-header">
                    <img src="/logo.png" alt="FederiGene Logo" className="auth-logo-img" />
                    <h1><span className="gradient-text">FederiGene</span></h1>
                </div>

                <div className="step-indicator">
                    {['Details', 'Security', 'Done'].map((label, i) => (
                        <div key={i} className={`step-dot ${i + 1 < regStep ? 'done' : ''} ${i + 1 === regStep ? 'active' : ''}`}>
                            {i + 1 < regStep ? '✓' : i + 1}
                        </div>
                    ))}
                </div>

                <h2>{['Account Details', 'Security Vault', 'Success'][regStep - 1]}</h2>
                <p className="auth-subtitle">{[
                    'Create your researcher profile.',
                    'Scan the QR code to enable 2FA.',
                    'Your account is ready.'
                ][regStep - 1]}</p>

                {regStep === 1 && (
                    <form onSubmit={handleFormNext} className="auth-form">
                        <div className="form-group">
                            <input type="text" name="username" placeholder="Username" required value={formData.username} onChange={handleInputChange} onBlur={() => checkAvailability('username', formData.username)} />
                            {availLoading.username && <span className="input-hint">Checking...</span>}
                        </div>

                        <div className="form-row">
                            <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleInputChange} />
                            <input type="text" name="last_name" placeholder="Last Name *" required value={formData.last_name} onChange={handleInputChange} />
                        </div>

                        <div className="form-group">
                            <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleInputChange} onBlur={() => checkAvailability('email', formData.email)} />
                            {availLoading.email && <span className="input-hint">Checking...</span>}
                        </div>

                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password (min 8 chars)" required value={formData.password} onChange={handleInputChange} autoComplete="new-password" style={{ paddingRight: '45px' }} />
                            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
                                )}
                            </button>
                        </div>
                        <div className="password-wrapper">
                            <input type={showConfirmPassword ? "text" : "password"} name="confirm_password" placeholder="Confirm Password" required value={formData.confirm_password} onChange={handleInputChange} autoComplete="new-password" style={{ paddingRight: '45px' }} />
                            <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"}>
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
                                )}
                            </button>
                        </div>
                        
                        <div className="security-section">
                            <h4>Security Questions (for recovery)</h4>
                            {answers.map((ans, idx) => {
                                // Filter questions: Show if it's the CURRENTLY selected one for this box, 
                                // OR if it's NOT selected in any of the OTHER boxes.
                                const otherSelectedIds = answers
                                    .filter((_, i) => i !== idx)
                                    .map(a => a.question_id)
                                    .filter(id => id !== '');

                                const availableQuestions = questions.filter(q => 
                                    q.id.toString() === ans.question_id || !otherSelectedIds.includes(q.id.toString())
                                );

                                return (
                                    <div key={idx} className="security-question-row">
                                        <select 
                                            className="form-input" 
                                            value={ans.question_id} 
                                            onChange={e => handleAnswerChange(idx, 'question_id', (e.target as any).value)} 
                                            required
                                        >
                                            <option value="">Select a question…</option>
                                            {availableQuestions.map(q => (
                                                <option key={q.id} value={q.id}>{q.question_text}</option>
                                            ))}
                                        </select>
                                        <input 
                                            type="text" 
                                            placeholder="Your Answer" 
                                            value={ans.answer} 
                                            onChange={e => handleAnswerChange(idx, 'answer', (e.target as any).value)} 
                                            required 
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="terms-agree-container">
                            <input type="checkbox" id="terms" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} required />
                            <label htmlFor="terms">I agree to the <span className="terms-link" onClick={() => setShowTerms(true)}>Terms & Conditions</span></label>
                        </div>

                        <button type="submit" className="action-btn submit-btn" disabled={!termsAgreed || loading}>Continue to 2FA Setup →</button>
                    </form>
                )}

                {showTerms && (
                    <div className="terms-overlay">
                        <div className="glass-card terms-modal">
                            <div className="terms-header">
                                <h3>Platform Terms & Conditions</h3>
                                <button className="close-btn" onClick={() => setShowTerms(false)}>✕</button>
                            </div>
                            <div className="terms-content" onScroll={handleTermsScroll} ref={termsScrollRef}>
                                {TERMS_CONTENT.split('\n').map((line, i) => {
                                    if (line.startsWith('###')) return <h4 key={i} style={{ marginTop: '1.5rem', color: 'var(--accent-color)' }}>{line.replace('### ', '')}</h4>;
                                    return <p key={i}>{line}</p>;
                                })}
                                <p style={{ textAlign: 'center', fontWeight: 'bold', color: scrolledToBottom ? '#22c55e' : 'inherit' }}>
                                    {scrolledToBottom ? '✓ End of Document Reached' : 'Keep scrolling to read all terms...'}
                                </p>
                            </div>
                            <div className="terms-footer">
                                <button className="action-btn" disabled={!scrolledToBottom} onClick={() => { setTermsAgreed(true); setShowTerms(false); }}>I Understand and Agree</button>
                            </div>
                        </div>
                    </div>
                )}

                {regStep === 2 && qrCodeData && (
                    <div className="auth-form">
                        <div className="qr-container" style={{ margin: '20px auto', background: 'white', padding: 15, borderRadius: 12, width: 'fit-content' }}>
                            <QRCodeSVG value={qrCodeData.uri} size={180} />
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>Scan with Google Authenticator or Microsoft Authenticator.</p>
                        
                        <input 
                            type="text" 
                            placeholder="Enter 6-digit Code" 
                            required 
                            maxLength={6} 
                            value={totpCode} 
                            onChange={e => setTotpCode(e.target.value)} 
                            className="totp-input" 
                            style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2rem', marginBottom: '1.5rem' }} 
                        />
                        
                        <button className="action-btn submit-btn" onClick={handleSubmit} disabled={loading || totpCode.length !== 6}>
                            {loading ? 'Finalizing...' : 'Complete Registration →'}
                        </button>
                    </div>
                )}

                {regStep === 3 && (
                    <div className="auth-form success-step" style={{ textAlign: 'center' }}>
                        <div className="success-icon" style={{ fontSize: '4rem', margin: '1rem 0' }}>📬</div>
                        <h3>Almost there!</h3>
                        <p>We've sent a verification link to <strong>{formData.email}</strong>. Please verify your email to activate your account.</p>
                        <button className="action-btn submit-btn" onClick={() => navigate('/login')}>Back to Login</button>
                    </div>
                )}

                {regStep === 1 && <p className="auth-footer">Already have an account? <Link to="/login">Login here</Link></p>}
            </div>
        </div>
    );
}
