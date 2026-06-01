import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function DatasetList() {
    const navigate = useNavigate();
    usePageTitle('Datasets');
    const [datasets, setDatasets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', data_type: 'genomic', row_count: '', feature_count: '', consent_type: 'irb_approved' });
    const [error, setError] = useState<any>(null);

    const fetchDatasets = () => {
        api.get('/platform/datasets')
            .then(res => setDatasets(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDatasets();
        const interval = setInterval(() => {
            api.get('/platform/datasets')
               .then(res => setDatasets(res.data))
               .catch(() => { });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post('/platform/datasets', {
                ...form,
                row_count: form.row_count ? parseInt(form.row_count) : null,
                feature_count: form.feature_count ? parseInt(form.feature_count) : null,
            });
            setShowCreate(false);
            setForm({ name: '', description: '', data_type: 'genomic', row_count: '', feature_count: '', consent_type: 'irb_approved' });
            fetchDatasets();
        } catch (err) { setError(err.response?.data?.detail || 'Failed to register dataset'); }
    };
    const [zkpLoading, setZkpLoading] = useState({});

    const handleZkpAttest = async (datasetId) => {
        setZkpLoading(prev => ({ ...prev, [datasetId]: true }));
        try {
            await api.post(`/platform/datasets/${datasetId}/zkp-attest`);
            alert("ZKP Attestation Successful!");
            fetchDatasets();
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Attestation failed.";
            alert(msg);
        }
        finally { setZkpLoading(prev => ({ ...prev, [datasetId]: false })); }
    };

    const qualityBadge = (score) => {
        if (!score) return { grade: '?', color: '#6b7280' };
        if (score >= 80) return { grade: 'A', color: '#22c55e' };
        if (score >= 60) return { grade: 'B', color: '#f59e0b' };
        if (score >= 40) return { grade: 'C', color: '#f97316' };
        return { grade: 'D', color: '#ef4444' };
    };


    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><span className="gradient-text">Datasets </span><span className="emoji">🗂️</span></h1>
                    <p>Register and manage dataset metadata — raw data never leaves your site</p>
                </div>
                <button className="action-btn" onClick={() => setShowCreate(!showCreate)} style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                    {showCreate ? '✕ Cancel' : '+ Register Dataset'}
                </button>
            </div>

            {showCreate && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                    <h3>Register Dataset (Metadata Only)</h3>
                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Dataset Name</label>
                                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: (e.target as any).value }))} placeholder="e.g., BRCA Mutations - 2024 Cohort" />
                            </div>
                            <div className="form-group">
                                <label>Data Type</label>
                                <select className="form-input" value={form.data_type} onChange={e => setForm(f => ({ ...f, data_type: (e.target as any).value }))}>
                                    <option value="genomic">Genomic</option>
                                    <option value="clinical">Clinical</option>
                                    <option value="imaging">Medical Imaging</option>
                                    <option value="proteomic">Proteomic</option>
                                    <option value="metabolomic">Metabolomic</option>
                                    <option value="ehr">EHR</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: (e.target as any).value }))} placeholder="Describe what this dataset contains…"></textarea>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Row Count (Samples)</label>
                                <input type="number" value={form.row_count} onChange={e => setForm(f => ({ ...f, row_count: (e.target as any).value }))} placeholder="e.g., 15000" />
                            </div>
                            <div className="form-group">
                                <label>Feature Count</label>
                                <input type="number" value={form.feature_count} onChange={e => setForm(f => ({ ...f, feature_count: (e.target as any).value }))} placeholder="e.g., 2048" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Consent Type</label>
                            <select className="form-input" value={form.consent_type} onChange={e => setForm(f => ({ ...f, consent_type: (e.target as any).value }))}>
                                <option value="irb_approved">IRB Approved</option>
                                <option value="patient_consent">Patient Consent</option>
                                <option value="anonymized">Fully Anonymized</option>
                                <option value="synthetic">Synthetic Data</option>
                            </select>
                        </div>
                        <button type="submit" className="action-btn" style={{ fontSize: '0.9rem', padding: '10px 24px' }}>Register Dataset →</button>
                    </form>
                </div>
            )}

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : datasets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🗂️</div>
                        <p>No datasets registered. Register one to participate in federated learning.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Name</th><th>Type</th><th>Samples</th><th>Quality</th><th>Consent</th><th>ZKP</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {datasets.map(d => {
                                const { grade, color } = qualityBadge(d.quality_score);
                                return (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                                        <td><span className="badge" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>{d.data_type}</span></td>
                                        <td>{d.row_count?.toLocaleString() || '—'}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color, fontSize: '1rem' }}>{grade}</span>
                                            {d.quality_score && <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: 4 }}>({d.quality_score})</span>}
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>{d.consent_type || '—'}</td>
                                        <td>
                                            {d.zkp_verified
                                                ? <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.8rem' }}>✓ ZKP Verified</span>
                                                : <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>⚠ Unverified</span>
                                            }
                                        </td>
                                        <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {!d.zkp_verified && (
                                                    <button onClick={() => handleZkpAttest(d.id)} disabled={zkpLoading[d.id]}
                                                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#8b5cf6', borderRadius: 6, padding: '3px 9px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                                        {zkpLoading[d.id] ? '…' : '🔏 Attest'}
                                                    </button>
                                                )}
                                                <button onClick={() => navigate(`/datasets/${d.id}/consent`)}
                                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', borderRadius: 6, padding: '3px 9px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 600 }}>
                                                    📋 Consent
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
