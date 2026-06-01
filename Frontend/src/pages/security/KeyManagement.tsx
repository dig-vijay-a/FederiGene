import { useState, useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import api from '../../utils/api';

export default function KeyManagement() {
    usePageTitle('Key Management');
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/platform/security/keys')
            .then(res => setKeys(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Key Management </span><span className="emoji">🔑</span></h1>
                <p>Manage Homomorphic Encryption keys and Platform Integrity Secrets.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-value">30 Days</div>
                    <div className="stat-label">Rotation Policy</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔐</div>
                    <div className="stat-value">BFV Scheme</div>
                    <div className="stat-label">HE Algorithm</div>
                </div>
            </div>

            <div className="content-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Platform Keys</h3>
                    <button className="action-btn" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Rotate Keys Now</button>
                </div>

                <table className="data-table">
                    <thead><tr><th>Key Identifier</th><th>Type</th><th>Algorithm</th><th>Status</th><th>Expires</th></tr></thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading keys...</td></tr>}
                        {!loading && keys.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>No cryptographic keys found.</td></tr>}
                        {!loading && keys.map(k => (
                            <tr key={k.id}>
                                <td style={{ fontFamily: 'monospace' }}>{k.identifier}</td>
                                <td>{k.key_type}</td>
                                <td>{k.algorithm}</td>
                                <td><span className={`badge ${k.status === 'Active' ? 'badge-active' : ''}`}>{k.status}</span></td>
                                <td style={{ opacity: k.expires_at ? 1 : 0.5 }}>{k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
