// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import api from '../../utils/api';
import './AccountSettings.css';

const API_BASE = import.meta.env.VITE_API_URL === '/api' ? '' : (import.meta.env.VITE_API_URL?.replace('/api', '') || '');

export default function AccountSettings() {
    usePageTitle('Account Settings');
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        displayName: '',
        bio: '',
        email: ''
    });
    const [avatarPreview, setAvatarPreview] = useState<any>(null);
    const fileInputRef = useRef<any>(null);

    const [passwords, setPasswords] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    
    const [loading, setLoading] = useState(false);
    
    // Sessions state
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Initialize profile data from user
    useEffect(() => {
        if (user) {
            setProfileData({
                displayName: user.display_name || user.username || '',
                bio: user.bio || '',
                email: user.email || ''
            });
            setAvatarPreview(user.avatar_url ? `${API_BASE}${user.avatar_url}` : null);
        }
    }, [user]);

    // Fetch sessions when tab changes
    useEffect(() => {
        if (activeTab === 'sessions') {
            fetchSessions();
        }
    }, [activeTab]);

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const res = await api.get('/users/me/sessions');
            setSessions(res.data);
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            setSessionsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (passwords.new_password !== passwords.confirm_password) {
            showToast('New passwords do not match', 'error');
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/change-password', passwords);
            showToast('Security credentials rotated successfully.', 'success');
            setPasswords({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            showToast(err.response?.data?.detail || 'Rotation failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/users/me/profile', {
                display_name: profileData.displayName,
                bio: profileData.bio
            });
            showToast('Profile identity updated successfully.', 'success');
            refreshUser();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Profile update failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);

        // Upload
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Profile photo updated.', 'success');
            setAvatarPreview(`${API_BASE}${res.data.avatar_url}`);
            refreshUser();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Avatar upload failed.', 'error');
            // Revert preview
            setAvatarPreview(user?.avatar_url ? `${API_BASE}${user.avatar_url}` : null);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            await api.delete(`/users/me/sessions/${sessionId}`);
            showToast('Session revoked successfully.', 'success');
            fetchSessions();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to revoke session.', 'error');
        }
    };

    const formatTimeAgo = (isoString) => {
        if (!isoString) return 'Unknown';
        const diff = Date.now() - new Date(isoString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="settings-container">
            <div className="page-header">
                <h1><span className="emoji">👤</span><span className="gradient-text"> Account Sovereignty</span></h1>
                <p>Manage your identity, security credentials, and platform presence.</p>
            </div>

            <div className="settings-grid">
                {/* Sidebar Navigation */}
                <aside className="settings-sidebar" onClick={() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); }}>
                    <button className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <span>👤</span> Profile Identity
                    </button>
                    <button className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <span>🔐</span> Security Hub
                    </button>
                    <button className={`settings-tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                        <span>📱</span> Active Sessions
                    </button>
                    <button className={`settings-tab ${activeTab === 'org' ? 'active' : ''}`} onClick={() => setActiveTab('org')}>
                        <span>🏥</span> Organization Context
                    </button>
                </aside>

                {/* Main Content Area */}
                <main className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-section-card">
                            <div className="settings-section-header">
                                <h2>Profile Identity</h2>
                                <p>How your identity appears across the FederiGene ecosystem.</p>
                            </div>

                            <div className="profile-setup-header">
                                <div className="large-avatar-upload" onClick={handleAvatarClick} title="Click to upload profile photo">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="large-avatar-img" />
                                    ) : (
                                        <div className="large-avatar">{profileData.displayName[0]?.toUpperCase()}</div>
                                    )}
                                    <div className="avatar-edit-badge">📷</div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <div className="profile-intro">
                                    <h3>{profileData.displayName}</h3>
                                    <p className="profile-username">@{user?.username}</p>
                                    <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate}>
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input type="text" value={profileData.displayName} onChange={e => setProfileData({...profileData, displayName: (e.target as any).value})} />
                                    <span className="field-hint">This is your public-facing name — separate from your login username (@{user?.username}).</span>
                                </div>
                                <div className="form-group">
                                    <label>Email Address (Primary)</label>
                                    <input type="email" value={profileData.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '4px' }}>✓ Verified Identity</span>
                                </div>
                                <div className="form-group">
                                    <label>Professional Bio</label>
                                    <textarea rows={4} value={profileData.bio} onChange={e => setProfileData({...profileData, bio: (e.target as any).value})} placeholder="Describe your role and expertise..."></textarea>
                                    <span className="field-hint">Visible to other platform members and collaborators. Max 500 characters.</span>
                                </div>
                                <button type="submit" className="action-btn" style={{ marginTop: '1rem' }} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Identity Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-content">
                            <div className="settings-section-card">
                                <div className="settings-section-header">
                                    <h2>Multi-Factor Security Hub</h2>
                                    <p>Your account is protected by multi-layer authentication.</p>
                                </div>

                                <div className="security-status-grid">
                                    <div className="security-stat-item">
                                        <div className="stat-top">
                                            <span className="stat-label">TOTP (Google Auth)</span>
                                            <span className="status-indicator enabled">Enabled</span>
                                        </div>
                                        <button className="reset-stat-btn" onClick={() => showToast('TOTP Reset is managed via Security Dashboard', 'info')}>
                                            <span className="btn-icon">🔄</span> Reset Secret Key
                                        </button>
                                    </div>
                                </div>

                                <h3>Rotate Credentials</h3>
                                <form onSubmit={handlePasswordChange} style={{ marginTop: '1rem' }}>
                                    <div className="form-group">
                                        <label>Current Password</label>
                                        <input type="password" name="old_password" value={passwords.old_password} onChange={e => setPasswords({...passwords, [(e.target as any).name]: (e.target as any).value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input type="password" name="new_password" value={passwords.new_password} onChange={e => setPasswords({...passwords, [(e.target as any).name]: (e.target as any).value})} required />
                                    </div>
                                    <button className="action-btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                                        {loading ? 'Processing...' : 'Rotate Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="settings-section-card">
                            <div className="settings-section-header">
                                <h2>Active Security Sessions</h2>
                                <p>Devices currently authenticated with your 2FA credentials.</p>
                            </div>

                            <div className="sessions-list">
                                {sessionsLoading ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                                        Loading sessions...
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                                        No active sessions found.
                                    </div>
                                ) : sessions.map(session => (
                                    <div className="session-item" key={session.id}>
                                        <div className="session-icon">
                                            {session.is_current ? '💻' : '📱'}
                                        </div>
                                        <div className="session-info">
                                            <div className="session-device">
                                                {session.device_info}
                                                {session.is_current && <span className="current-badge">Current Session</span>}
                                            </div>
                                            <div className="session-meta">
                                                IP: {session.ip_address} • Last active: {formatTimeAgo(session.last_active_at)}
                                            </div>
                                        </div>
                                        {!session.is_current && (
                                            <button 
                                                className="sidebar-btn revoke-btn" 
                                                onClick={() => handleRevokeSession(session.id)}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'org' && (
                        <div className="settings-section-card">
                            <div className="settings-section-header">
                                <h2>Organization Context</h2>
                                <p>Your institutional affiliation and verified access rights.</p>
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div className="security-stat-item">
                                    <div style={{ fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Institution</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{user?.organization?.name || 'Independent Researcher'}</div>
                                    {user?.organization?.subscription_tier === 'institutional' && (
                                        <div style={{ fontSize: '0.9rem', color: '#22c55e' }}>✓ Verified Institutional Hub</div>
                                    )}
                                    {user?.organization?.subscription_tier && user.organization.subscription_tier !== 'institutional' && (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--accent-color)', textTransform: 'capitalize' }}>
                                            Level: {user.organization.subscription_tier}
                                        </div>
                                    )}
                                </div>

                                <div className="security-stat-item">
                                    <div style={{ fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Verified Role</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ') || 'Researcher'}</div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Permissions: Read, Write, Aggregate, Administer Nodes</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="settings-section-card danger-zone">
                        <h3>☢️ Danger Zone</h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Irreversible actions regarding your account sovereignty.</p>
                        <button className="action-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', marginTop: '1rem' }} onClick={() => showToast('Account deactivation requires admin approval', 'info')}>
                            Deactivate Account
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
