import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function Security() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await api.get('/users/me/sessions');
                setSessions(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSessions();
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match", "error");
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            showToast("Password changed successfully", "success");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast(error.response?.data?.detail || "Failed to change password", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: number) => {
        try {
            await api.delete(`/users/me/sessions/${sessionId}`);
            showToast("Session revoked", "success");
            setSessions(sessions.filter(s => s.id !== sessionId));
        } catch (err: any) {
            showToast(err.response?.data?.detail || "Failed to revoke session", "error");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.5rem', cursor: 'pointer' }}
                >
                    ←
                </button>
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Security & 2FA</h1>
            </header>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem' }}>Two-Factor Authentication</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>Authenticator App (TOTP)</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Secured with Web3 Enclave</div>
                    </div>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>Active ✓</div>
                </div>
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem' }}>Change Password</h3>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                        type="password" 
                        placeholder="Current Password" 
                        value={currentPassword} 
                        onChange={e => setCurrentPassword(e.target.value)} 
                        className="input-field" 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        className="input-field" 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Confirm New Password" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        className="input-field" 
                        required 
                    />
                    <button type="submit" disabled={loading} className="action-btn">
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem' }}>Active Sessions</h3>
                {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', marginBottom: '0.5rem', border: s.is_current ? '1px solid var(--accent-color)' : '1px solid transparent' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{s.device_info} {s.is_current && "(Current)"}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>IP: {s.ip_address}</div>
                        </div>
                        {!s.is_current && (
                            <button onClick={() => handleRevokeSession(s.id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '0.3rem 0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                Revoke
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
