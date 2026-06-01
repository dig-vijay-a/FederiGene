import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function ConsentManagement() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dataset, setDataset] = useState<any>(null);
    const [consents, setConsents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState({});
    const [requesting, setRequesting] = useState({});
    const [gdprModalConsentId, setGdprModalConsentId] = useState<number | null>(null);

    usePageTitle('Consent Ledger');

    const fetchData = () => {
        Promise.all([
            api.get(`/platform/datasets/${id}`),
            api.get(`/platform/datasets/${id}/consent`)
        ]).then(([dsRes, cRes]) => {
            setDataset(dsRes.data);
            setConsents(cRes.data);
        }).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { 
        fetchData(); 
        const interval = setInterval(fetchData, 10000); // Live polling every 10s
        return () => clearInterval(interval);
    }, [id]);

    const handleRevoke = async (consentId) => {
        setRevoking(prev => ({ ...prev, [consentId]: true }));
        try {
            await api.post(`/platform/consent/${consentId}/revoke`);
            fetchData();
        } catch { } finally { setRevoking(prev => ({ ...prev, [consentId]: false })); }
    };

    const handleGdprDelete = async (consentId) => {
        setGdprModalConsentId(consentId);
    };

    const confirmGdprDelete = async () => {
        if (!gdprModalConsentId) return;
        const consentId = gdprModalConsentId;
        setGdprModalConsentId(null);
        setRequesting(prev => ({ ...prev, [consentId]: true }));
        try {
            await api.post(`/platform/consent/${consentId}/gdpr-delete`);
            fetchData();
        } catch { } finally { setRequesting(prev => ({ ...prev, [consentId]: false })); }
    };

    const SCOPES = [
        { key: 'training_use', label: 'FL Training', icon: '🧠' },
        { key: 'academic_use', label: 'Academic Research', icon: '📚' },
        { key: 'commercial_use', label: 'Commercial Use', icon: '💼' },
    ];

    const [newRequestUsername, setNewRequestUsername] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);

    const handleRequestConsent = async (e) => {
        e.preventDefault();
        if (!newRequestUsername.trim()) return;
        setSendingRequest(true);
        try {
            await api.post(`/platform/datasets/${id}/request-consent`, { patient_username: newRequestUsername });
            setNewRequestUsername('');
            fetchData();
            // Assuming you have a toast hook, or just alert
            alert("Consent request sent.");
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Failed to send request. Make sure the username exists.";
            alert(msg);
        } finally {
            setSendingRequest(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <button onClick={() => navigate('/datasets')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, marginBottom: '0.5rem', fontWeight: 600 }}>← Back to Datasets</button>
                <h1><span className="emoji">📋</span><span className="gradient-text"> Consent Management Ledger</span></h1>
                {dataset && <p>Managing patient consent records for: <strong>{dataset.name}</strong></p>}
            </div>

            <div className="content-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Request Data Access</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Send a consent request to a patient's sovereign data wallet.</p>
                </div>
                <form onSubmit={handleRequestConsent} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        type="text" 
                        placeholder="Patient Username..." 
                        value={newRequestUsername}
                        onChange={(e) => setNewRequestUsername(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
                    />
                    <button type="submit" className="action-btn" disabled={sendingRequest}>
                        {sendingRequest ? 'Sending...' : 'Request Access'}
                    </button>
                </form>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-icon">📜</div><div className="stat-value">{consents.length}</div><div className="stat-label">Total Records</div></div>
                <div className="stat-card"><div className="stat-icon" style={{ color: '#22c55e' }}>✅</div><div className="stat-value">{consents.filter(c => !c.revoked_at && !c.gdpr_delete_requested).length}</div><div className="stat-label">Active Consents</div></div>
                <div className="stat-card"><div className="stat-icon" style={{ color: '#ef4444' }}>🗑️</div><div className="stat-value">{consents.filter(c => c.gdpr_delete_requested).length}</div><div className="stat-label">GDPR Deletions</div></div>
            </div>

            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Active Consent Records</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                        All records are immutable. Revocation is logged but data is not deleted unless a GDPR request is raised.
                    </span>
                </div>
                {loading ? <div className="empty-state"><p>Loading consent records…</p></div> :
                    consents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <p>No consent records yet. Records are created when patients grant consent for their data to be used in federated learning.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead><tr>
                                <th>Record #</th><th>Scope</th><th>Granted</th><th>Status</th><th>GDPR</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {consents.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.7 }}>#{c.id}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {SCOPES.filter(s => c[s.key]).map(s => (
                                                    <span key={s.key} className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.72rem' }}>
                                                        {s.icon} {s.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem', opacity: 0.7 }}>{new Date(c.granted_at).toLocaleDateString()}</td>
                                        <td>
                                            {c.status === 'pending' ? (
                                                <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>Pending Patient Approval</span>
                                            ) : c.status === 'rejected' ? (
                                                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Rejected by Patient</span>
                                            ) : c.revoked_at ? (
                                                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Revoked</span>
                                            ) : (
                                                <span className="badge badge-active">Approved</span>
                                            )}
                                        </td>
                                        <td>
                                            {c.gdpr_delete_requested
                                                ? <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>🗑️ Pending</span>
                                                : <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {c.status === 'approved' && !c.revoked_at && (
                                                    <button onClick={() => handleRevoke(c.id)} disabled={revoking[c.id]}
                                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        {revoking[c.id] ? '…' : 'Revoke'}
                                                    </button>
                                                )}
                                                {!c.gdpr_delete_requested && (
                                                    <button onClick={() => handleGdprDelete(c.id)} disabled={requesting[c.id]}
                                                        style={{ background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.3)', color: '#6b7280', borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        {requesting[c.id] ? '…' : 'GDPR Delete'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                <p style={{ marginTop: '1rem', fontSize: '0.72rem', opacity: 0.4 }}>
                    ⚠️ Consent records are hash-chained for tamper evidence. All revocations and GDPR requests are logged in the immutable Audit Trail.
                </p>
            </div>

            {gdprModalConsentId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="glass-card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(145deg, rgba(30,30,40,0.9), rgba(20,20,30,0.95))' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ color: '#fca5a5', margin: '0 0 1rem 0' }}>Request GDPR Deletion?</h2>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '2rem' }}>
                            This action will permanently instruct the hospital to destroy the raw DNA and medical records associated with this consent. This cannot be undone. Continue?
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="action-btn" onClick={() => setGdprModalConsentId(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>Cancel</button>
                            <button className="action-btn" onClick={confirmGdprDelete} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none' }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
