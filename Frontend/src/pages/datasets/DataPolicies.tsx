import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function DataPolicies() {
    const { id } = useParams();
    usePageTitle('Data Policies');
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [policy, setPolicy] = useState({
        allowed_org_types: ['University', 'Research Institute', 'Hospital'],
        min_epsilon: 1.0,
        usage_limit: 'unlimited'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/platform/datasets/${id}/policies`)
            .then(res => setPolicy(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleOrgTypeToggle = (type) => {
        setPolicy(prev => {
            const list = prev.allowed_org_types.includes(type)
                ? prev.allowed_org_types.filter(t => t !== type)
                : [...prev.allowed_org_types, type];
            return { ...prev, allowed_org_types: list };
        });
    };

    const handleSave = (e) => {
        e.preventDefault();
        api.put(`/platform/datasets/${id}/policies`, policy)
            .then(res => {
                showToast("Policies Updated Successfully!", 'success');
                navigate('/datasets');
            })
            .catch(err => showToast("Failed to save policies", 'error'));
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Policies...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button onClick={() => navigate('/datasets')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, marginBottom: '0.5rem', fontWeight: 600 }}>← Back to Datasets</button>
                    <h1><span className="gradient-text">Dataset #{id} Policies </span><span className="emoji">📜</span></h1>
                    <p>Internal governance configuration for federated dataset usage.</p>
                </div>
            </div>

            <div className="content-card">
                <h3>Governance & Consent Limits</h3>
                <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>
                    Define rules on which external organizations are permitted to utilize this metadata signature for federated model training. FederiGene guarantees that raw data never leaves your environment regardless of these settings.
                </p>

                <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label>Approved Organization Types</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: 10 }}>
                            {['University', 'Research Institute', 'Pharma / Commercial', 'Hospital'].map(type => (
                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={policy.allowed_org_types.includes(type)}
                                        onChange={() => handleOrgTypeToggle(type)}
                                    /> {type}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label>Minimum Differential Privacy Epsilon (ε)</label>
                        <input
                            type="number"
                            min="0.1" step="0.1"
                            value={policy.min_epsilon}
                            onChange={e => setPolicy({ ...policy, min_epsilon: parseFloat((e.target as any).value) })}
                        />
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>
                            Reject participation in training jobs that request an epsilon higher than this threshold (lower = more private).
                        </p>
                    </div>

                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <label>Usage Limits</label>
                        <select className="form-input" value={policy.usage_limit}
                            onChange={e => setPolicy({ ...policy, usage_limit: (e.target as any).value })}
                        >
                            <option value="unlimited">Unlimited Training Rounds</option>
                            <option value="10_jobs">Max 10 Jobs Total</option>
                            <option value="academic_only">Academic Projects Only</option>
                        </select>
                    </div>

                    <button type="submit" className="action-btn" style={{ marginTop: '1rem' }}>Save Policies</button>
                </form>
            </div>
        </div>
    );
}
