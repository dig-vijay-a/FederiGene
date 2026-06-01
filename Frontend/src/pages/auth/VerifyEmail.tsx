import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';
import './Auth.css';

import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
    usePageTitle('Verify Email');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, checkAuth } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');
    const calledRef = useRef(false);

    useEffect(() => {
        if (calledRef.current) return;
        
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        calledRef.current = true;

        api.post('/auth/verify-email', { token })
            .then(res => {
                setStatus('success');
                setMessage(res.data.message);
                if (user?.isAuthenticated) {
                    checkAuth(); // Refresh user state so is_email_verified becomes true in the app
                }
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.response?.data?.detail || 'Verification failed.');
            });
    }, [searchParams]); // purposely omit user and checkAuth so it doesn't re-run when auth changes

    return (
        <div className="auth-container">
            <div className="glass-card auth-card" style={{ textAlign: 'center' }}>
                <div className="auth-logo-header">
                    <img src="/logo.png" alt="FederiGene Logo" className="auth-logo-img" />
                    <h1><span className="gradient-text">FederiGene</span></h1>
                </div>
                <h2>Email Verification</h2>
                <div className={`status-icon ${status}`} style={{ fontSize: '3rem', margin: '20px 0' }}>
                    {status === 'verifying' && '⏳'}
                    {status === 'success' && '✅'}
                    {status === 'error' && '❌'}
                </div>
                <p className="auth-subtitle">{message}</p>

                {status !== 'verifying' && (
                    <button className="action-btn" onClick={() => navigate(user?.isAuthenticated ? '/dashboard' : '/login')}>
                        {user?.isAuthenticated ? 'Go to Dashboard →' : 'Go to Login →'}
                    </button>
                )}
            </div>
        </div>
    );
}
