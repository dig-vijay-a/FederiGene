import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './Auth.css';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showToast } = useToast();

    const [step, setStep] = useState(1); // 1 = Password, 2 = TOTP, 5 = Security Questions
    const [tempToken, setTempToken] = useState(null);
    const [formData, setFormData] = useState({ username_or_email: '', password: '' });
    const [totpCode, setTotpCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Fallback state
    const [fallbackQuestions, setFallbackQuestions] = useState([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState('');
    const [fallbackAnswer, setFallbackAnswer] = useState('');

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', formData);
            if (res.data.requires_step === -1) {
                showToast('Email not verified. Please check your inbox.', 'error');
                return;
            }
            setTempToken(res.data.temp_token);
            if (res.data.requires_step === 0) {
                login(res.data.user, res.data.access_token);
                showToast('Login successful!', 'success');
                navigate('/dashboard');
            } else {
                setStep(res.data.requires_step);
            }
        } catch (err) {
            showToast(err.response?.data?.detail || `Network Error: ${err.message}`, 'error');
        } finally { setLoading(false); }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-2fa', { temp_token: tempToken, totp_code: totpCode });
            if (res.data.requires_step === 0) {
                login(res.data.user, res.data.access_token);
                showToast('Welcome back!', 'success');
                navigate('/dashboard');
            } else {
                setStep(res.data.requires_step);
            }
        } catch (err) {
            showToast(err.response?.data?.detail || 'Invalid 2FA code.', 'error');
            setTotpCode('');
        } finally { setLoading(false); }
    };

    const switchToFallback = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/auth/login-questions?temp_token=${tempToken}`);
            setFallbackQuestions(res.data);
            setStep(5);
        } catch (err) {
            showToast('Failed to load security questions.', 'error');
        } finally { setLoading(false); }
    };

    const handleFallbackSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-questions-login', {
                recovery_token: tempToken,
                question_id: parseInt(selectedQuestionId),
                answer: fallbackAnswer
            });
            login(res.data.user, res.data.access_token);
            showToast('Identity verified via fallback.', 'success');
            navigate('/dashboard');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Incorrect answer.', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-container">
            <div className="glass-card auth-card">
                <div className="auth-logo-header">
                    <img src="/logo.png" alt="FederiGene" style={{ height: '60px', marginBottom: '1rem', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }} />
                    <h1><span className="gradient-text">FederiGene</span></h1>
                </div>

                <div className="step-indicator">
                    {[1, 2].map(s => (
                        <div key={s} className={`step-dot ${s < step || step === 5 ? 'done' : ''} ${s === step ? 'active' : ''}`}>{s < step ? '✓' : s}</div>
                    ))}
                </div>

                <h2>{step === 5 ? 'Security Fallback' : ['Welcome Back', 'Two-Factor Auth'][step - 1]}</h2>
                <p className="auth-subtitle">{step === 5 ? 'Verify your identity using your security questions.' : 'Patient Data Sovereignty.'}</p>
                
                {step === 1 && (
                    <form onSubmit={handleLogin} className="auth-form">
                        <input type="text" name="username_or_email" placeholder="Username or Email" required value={formData.username_or_email} onChange={handleInputChange} />
                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" required value={formData.password} onChange={handleInputChange} style={{ paddingRight: '45px' }} />
                            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
                                )}
                            </button>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                            <Link to="/forgot-password" title="Forgot Password?" className="forgot-link" style={{ fontSize: '0.9rem' }}>Forgot Password?</Link>
                        </div>
                        <button type="submit" className="action-btn submit-btn" disabled={loading}>Continue →</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handle2FA} className="auth-form">
                        <input type="text" placeholder="000000" required maxLength="6" value={totpCode} onChange={e => setTotpCode(e.target.value)} className="totp-input" autoFocus />
                        <button type="submit" className="action-btn submit-btn" disabled={loading}>Verify & Login →</button>
                        
                        <div className="auth-step-footer">
                            <button type="button" className="text-link" onClick={switchToFallback}>
                                Can't access your authenticator? <span>Try Security Questions</span>
                            </button>
                        </div>
                    </form>
                )}

                {step === 5 && (
                    <form onSubmit={handleFallbackSubmit} className="auth-form">
                        <select className="form-input" value={selectedQuestionId} onChange={e => setSelectedQuestionId(e.target.value)} required>
                            <option value="">Select your question...</option>
                            {fallbackQuestions.map(q => (
                                <option key={q.id} value={q.id}>{q.question_text}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="Your Answer" required value={fallbackAnswer} onChange={e => setFallbackAnswer(e.target.value)} />
                        
                        <button type="submit" className="action-btn submit-btn" disabled={loading}>Verify Identity →</button>
                        
                        <div className="auth-step-footer">
                            <button type="button" className="text-link" onClick={() => setStep(2)}>
                                <span>Back to 2FA</span>
                            </button>
                        </div>
                    </form>
                )}

                {step === 1 && (
                    <p className="auth-footer">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
