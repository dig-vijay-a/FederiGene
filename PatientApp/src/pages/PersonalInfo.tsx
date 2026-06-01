import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function PersonalInfo() {
    const { user, login } = useAuth(); // login is often used to refresh user context if needed, but we can just mutate locally or re-fetch /me
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.put('/users/me/profile', { display_name: displayName, bio });
            showToast("Profile updated successfully!", "success");
        } catch (error: any) {
            showToast(error.response?.data?.detail || "Failed to update profile", "error");
        } finally {
            setLoading(false);
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
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Personal Info</h1>
            </header>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Username (Immutable)</label>
                    <input type="text" value={user?.username || ''} disabled style={{ width: '100%', opacity: 0.5 }} className="input-field" />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Email (Immutable)</label>
                    <input type="text" value={user?.email || ''} disabled style={{ width: '100%', opacity: 0.5 }} className="input-field" />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Role</label>
                    <input type="text" value={user?.role?.toUpperCase() || ''} disabled style={{ width: '100%', opacity: 0.5 }} className="input-field" />
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)' }} />
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Display Name</label>
                    <input 
                        type="text" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)}
                        className="input-field" 
                        style={{ width: '100%' }}
                        placeholder="How you appear to others" 
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Bio</label>
                    <textarea 
                        value={bio} 
                        onChange={e => setBio(e.target.value)}
                        className="input-field" 
                        style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                        placeholder="A short bio" 
                    />
                </div>
                <button onClick={handleSave} disabled={loading} className="action-btn" style={{ marginTop: '0.5rem' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
