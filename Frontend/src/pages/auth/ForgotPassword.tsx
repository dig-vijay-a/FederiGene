// @ts-nocheck
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import './Auth.css';

export default function ForgotPassword() {
    usePageTitle('Recover Account');
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ username_or_email: '' });
    const [otpCode, setOtpCode] = useState('');

    // Security Question Challenge states
    const [challengeData, setChallengeData] = useState<any>(null);
    const [selectedQuestion, setSelectedQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');

    // Reset Password states
    const [resetToken, setResetToken] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [message, setMessage] = useState<any>(null);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null); setMessage(null);
        try {
            const res = await api.post('/auth/forgot-password', formData);
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to initiate recovery.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const res = await api.post('/auth/verify-otp', {
                username_or_email: formData.username_or_email,
                otp_code: otpCode
            });
            // Returns { recovery_token, questions }
            setChallengeData(res.data);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid or expired OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySecurityQuestion = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const res = await api.post('/auth/verify-security-question', {
                recovery_token: challengeData.recovery_token,
                question_id: parseInt(selectedQuestion),
                answer: securityAnswer
            });
            // Returns { message, password_reset_token }
            setResetToken(res.data.password_reset_token);
            setStep(4);
        } catch (err) {
            setError(err.response?.data?.detail || "Incorrect security answer.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            await api.post('/auth/reset-password', {
                password_reset_token: resetToken,
                new_password: newPassword
            });
            showToast("Password reset successfully! Please log in.", 'success');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card auth-card">
                <div className="auth-logo-header">
                    <img src="/logo.png" alt="FederiGene Logo" className="auth-logo-img" />
                    <h1><span className="gradient-text">FederiGene</span></h1>
                </div>
                <h2>Account Recovery</h2>
                <p className="auth-subtitle">Verify your identity to reset your password and regain access.</p>
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="auth-form">
                        <p>Enter your Email or Username to receive an OTP.</p>
                        <input
                            type="text" required
                            placeholder="Username or Email"
                            value={formData.username_or_email}
                            onChange={e => setFormData({ username_or_email: (e.target as any).value })}
                        />
                        <button type="submit" className="action-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="auth-form">
                        <p>We've sent a 6-digit OTP to your registered email.</p>
                        <input
                            type="text" required maxLength="6"
                            placeholder="000000"
                            value={otpCode}
                            onChange={e => setOtpCode((e.target as any).value)}
                            className="totp-input"
                        />
                        <button type="submit" className="action-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleVerifySecurityQuestion} className="auth-form">
                        <p>Please answer one of your security questions to continue.</p>
                        <select className="form-input" value={selectedQuestion}
                            onChange={e => setSelectedQuestion((e.target as any).value)}
                            required
                        >
                            <option value="">Select a security question...</option>
                            {challengeData.questions.map(q => (
                                <option key={q.id} value={q.id}>{q.question_text}</option>
                            ))}
                        </select>
                        <input
                            type="text" required
                            placeholder="Your Answer"
                            value={securityAnswer}
                            onChange={e => setSecurityAnswer((e.target as any).value)}
                        />
                        <button type="submit" className="action-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Submit Answer'}
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <form onSubmit={handleResetPassword} className="auth-form">
                        <p>Enter your new password below.</p>
                        <input
                            type="password" required
                            placeholder="New Password"
                            value={newPassword}
                            onChange={e => setNewPassword((e.target as any).value)}
                        />
                        <button type="submit" className="action-btn" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <p className="auth-footer">
                        Remembered your password? <Link to="/login">Back to Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
