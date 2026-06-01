// @ts-nocheck
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function OrgApprovals() {
    usePageTitle('Admin | Approvals');
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState<any>(null);
    const [expandedOrg, setExpandedOrg] = useState<any>(null);

    const fetchPending = () => {
        api.get('/platform/orgs/pending')
            .then(res => setOrgs(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { 
        fetchPending(); 
        const interval = setInterval(fetchPending, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (orgId, action) => {
        try {
            const res = await api.post('/platform/orgs/approve', { org_id: orgId, action });
            setActionMsg(res.data.message);
            fetchPending();
        } catch (err) {
            setActionMsg(err.response?.data?.detail || 'Action failed');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Organization Approvals </span><span className="emoji">✅</span></h1>
                <p>Review and approve hospital/lab registration requests</p>
            </div>

            {actionMsg && <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>{actionMsg}</div>}

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : orgs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <p>No pending organization approvals.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Organization</th><th>Type</th><th>License</th><th>Country</th><th>Email</th><th>Applied</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {orgs.map(o => (
                                <React.Fragment key={o.id}>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>{o.name}</td>
                                        <td>{o.org_type}</td>
                                        <td>{o.license_number || '—'}</td>
                                        <td>{o.country || '—'}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{o.contact_email}</td>
                                        <td style={{ opacity: 0.6, fontSize: '0.82rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="action-btn" style={{ fontSize: '0.75rem', padding: '5px 12px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-color)' }} onClick={() => setExpandedOrg(expandedOrg === o.id ? null : o.id)}>
                                                    {expandedOrg === o.id ? 'Hide' : 'Review'}
                                                </button>
                                                <button className="action-btn" style={{ fontSize: '0.75rem', padding: '5px 12px', background: '#22c55e' }} onClick={() => handleAction(o.id, 'approve')}>Approve</button>
                                                <button className="action-btn" style={{ fontSize: '0.75rem', padding: '5px 12px', background: '#ef4444' }} onClick={() => handleAction(o.id, 'reject')}>Reject</button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrg === o.id && (
                                        <tr style={{ background: 'var(--card-bg)' }}>
                                            <td colSpan={7} style={{ padding: '1rem', borderTop: 'none' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>Tax ID / EIN</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{o.tax_id || 'Not provided'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>Official Website</span>
                                                        {o.website ? <a href={o.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#3b82f6' }}>{o.website}</a> : <strong style={{ fontSize: '0.9rem' }}>Not provided</strong>}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>Representative</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{o.representative_name || 'Not provided'}</strong>
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{o.representative_role}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>Legal Document</span>
                                                        {o.legal_document_url ? <a href={o.legal_document_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#3b82f6' }}>View Document</a> : <strong style={{ fontSize: '0.9rem' }}>Not provided</strong>}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
