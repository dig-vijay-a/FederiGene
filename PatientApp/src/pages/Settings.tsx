import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Settings</h1>
            </header>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{user?.display_name || user?.username}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{user?.email}</div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', fontWeight: '600', opacity: 0.8 }}>
                    Account
                </div>
                <div onClick={() => navigate('/settings/personal-info')} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span>Personal Information</span>
                    <span style={{ opacity: 0.5 }}>→</span>
                </div>
                <div onClick={() => navigate('/settings/security')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span>Security & 2FA</span>
                    <span style={{ opacity: 0.5 }}>→</span>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', fontWeight: '600', opacity: 0.8 }}>
                    App Preferences
                </div>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notifications</span>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)' }} />
                </div>
                <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Dark Mode</span>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)' }} />
                </div>
            </div>

            <button 
                onClick={handleLogout} 
                className="action-btn" 
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', marginTop: '1rem' }}
            >
                Log Out
            </button>
        </div>
    );
}
