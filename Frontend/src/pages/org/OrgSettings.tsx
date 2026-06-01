// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function OrgSettings() {
    const { user } = useAuth();
    usePageTitle('Org Settings');
    const { showToast } = useToast();
    const [settings, setSettings] = useState({
        default_epsilon: 2.0,
        require_admin_approval: false,
        alert_email_completed: true,
        alert_daily_summary: true,
        alert_security: true
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/platform/org/settings')
            .then(res => setSettings(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        api.put('/platform/org/settings', settings)
            .then(res => showToast(res.data.message, 'success'))
            .catch(err => showToast("Failed to save settings", 'error'));
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Settings...</div>;

    if (!user?.organization) {
        return (
            <div>
                <div className="page-header">
                    <h1><span className="gradient-text">Organization Settings </span><span className="emoji">⚙️</span></h1>
                    <p>Configure platform-wide preferences and defaults.</p>
                </div>
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon">🏥</div>
                        <p>No organization registered yet.</p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>You must belong to an organization to configure its settings.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (user?.role !== 'hospital_admin' && user?.role !== 'platform_admin') {
        return (
            <div>
                <div className="page-header">
                    <h1><span className="gradient-text">Organization Settings </span><span className="emoji">⚙️</span></h1>
                    <p>Configure {user?.organization?.name || 'your organization'}'s platform-wide preferences and defaults.</p>
                </div>
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon">🔒</div>
                        <p>Access Denied</p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>Only Hospital Administrators can manage these settings.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Organization Settings </span><span className="emoji">⚙️</span></h1>
                <p>Configure {user?.organization?.name || 'your organization'}'s platform-wide preferences and defaults.</p>
            </div>

            <div className="content-card">
                <h3>Global Data Governance Defaults</h3>
                <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label>Default Minimum Privacy Budget (ε)</label>
                        <input
                            type="number"
                            name="default_epsilon"
                            min="0.1" step="0.1"
                            value={settings.default_epsilon}
                            onChange={handleChange}
                        />
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>
                            Automatically applied to all newly registered datasets unless overridden by a Data Custodian.
                        </p>
                    </div>

                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label>Require Admin Approval for Training Joins</label>
                        <select className="form-input" name="require_admin_approval"
                            value={settings.require_admin_approval}
                            onChange={(e) => setSettings(prev => ({ ...prev, require_admin_approval: (e.target as any).value === 'true' }))}
                        >
                            <option value="false">No - Researchers can auto-join any approved job</option>
                            <option value="true">Yes - Require Hospital Admin sign-off for every job</option>
                        </select>
                    </div>

                    <hr style={{ borderColor: 'var(--card-border)', margin: '2rem 0' }} />

                    <h3>Notification Preferences</h3>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', fontSize: '0.9rem', marginBottom: 10 }}>
                            <input
                                type="checkbox"
                                name="alert_email_completed"
                                checked={settings.alert_email_completed}
                                onChange={handleChange}
                            />
                            Email alerts for newly completed Federated Training models.
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', fontSize: '0.9rem', marginBottom: 10 }}>
                            <input
                                type="checkbox"
                                name="alert_daily_summary"
                                checked={settings.alert_daily_summary}
                                onChange={handleChange}
                            />
                            Daily summary of dataset usage across all participating jobs.
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                name="alert_security"
                                checked={settings.alert_security}
                                onChange={handleChange}
                            />
                            Critical security alerts (Key rotations, failed integrity HMACs).
                        </label>
                    </div>

                    <button type="submit" className="action-btn" style={{ marginTop: '2rem' }}>Save Settings</button>
                </form>
            </div>
        </div>
    );
}
