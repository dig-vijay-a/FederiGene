import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function ModelRegistry() {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishModelId, setPublishModelId] = useState<number | null>(null);
    const [publishName, setPublishName] = useState('');
    const [publishArchitecture, setPublishArchitecture] = useState('');
    const [publishSpecialty, setPublishSpecialty] = useState('');
    const [publishDesc, setPublishDesc] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);

    const navigate = useNavigate();
    const { showToast } = useToast();
    usePageTitle('Model Registry');

    const fetchModels = () => {
        api.get('/platform/models')
            .then(res => setModels(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchModels();
        const interval = setInterval(fetchModels, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Model Registry </span><span className="emoji">📦</span></h1>
                <p>Track trained model versions, performance metrics, and integrity signatures</p>
            </div>

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : models.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <p>No models yet. Models are created automatically when training jobs complete rounds.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>Model Name</th><th>Version</th><th>Round</th><th>Accuracy</th><th>AUC</th><th>F1</th><th>Loss</th><th>Created</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {models.map(m => (
                                <tr key={m.id}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{m.job_name || "Unknown Project (Restart Backend)"}</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Job #{m.job_id}</span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{m.version}</td>
                                    <td>{m.round_number ?? '—'}</td>
                                    <td style={{ color: '#22c55e', fontWeight: 600 }}>{m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</td>
                                    <td>{m.auc != null ? m.auc.toFixed(3) : '—'}</td>
                                    <td>{m.f1_score != null ? m.f1_score.toFixed(3) : '—'}</td>
                                    <td>{m.loss != null ? m.loss.toFixed(4) : '—'}</td>
                                    <td style={{ opacity: 0.6, fontSize: '0.82rem' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => navigate(`/models/${m.id}/explain`)}
                                                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#8b5cf6', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                                            >
                                                🧬 Explain
                                            </button>

                                            {!m.is_published && (
                                                <button
                                                onClick={() => {
                                                        setPublishModelId(m.id);
                                                        setPublishName('');
                                                        setPublishArchitecture('');
                                                        setPublishSpecialty('');
                                                        setPublishDesc('');
                                                        setPublishModalOpen(true);
                                                    }}
                                                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                                                >
                                                    🏪 Publish
                                                </button>
                                            )}

                                            {m.is_published && (
                                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Global</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
        </div>

            {publishModalOpen && (
                <div className="modal-overlay" onClick={() => setPublishModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2>🏪 Publish to Marketplace</h2>
                        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Make this model available to the global consortium. Other organizations will be able to discover and license it.
                        </p>

                        <div className="form-group">
                            <label>Model Name</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g., CancerVision Pro"
                                value={publishName}
                                onChange={e => setPublishName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Architecture</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g., ViT-Large, ResNet-152"
                                value={publishArchitecture}
                                onChange={e => setPublishArchitecture(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Medical Specialty</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g., Oncology, Cardiology"
                                value={publishSpecialty}
                                onChange={e => setPublishSpecialty(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                className="form-input" 
                                placeholder="Describe the model's purpose, training data characteristics, and intended use cases..."
                                rows={4}
                                value={publishDesc}
                                onChange={e => setPublishDesc(e.target.value)}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button 
                                className="action-btn" 
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                                onClick={() => setPublishModalOpen(false)}
                                disabled={isPublishing}
                            >
                                Cancel
                            </button>
                            <button 
                                className="action-btn" 
                                style={{ background: '#22c55e' }}
                                onClick={() => {
                                    if (!publishName || !publishArchitecture || !publishSpecialty || !publishDesc) {
                                        showToast("Please fill in all fields", "error");
                                        return;
                                    }
                                    setIsPublishing(true);
                                    api.post(`/marketplace/models/${publishModelId}/publish`, { 
                                        name: publishName,
                                        architecture: publishArchitecture,
                                        specialty: publishSpecialty, 
                                        description: publishDesc 
                                    })
                                    .then(() => { 
                                        showToast("Model Published to Marketplace Successfully!", 'success');
                                        setPublishModalOpen(false);
                                        fetchModels();
                                    })
                                    .catch(err => showToast(err.response?.data?.detail || "Publish failed", 'error'))
                                    .finally(() => setIsPublishing(false));
                                }}
                                disabled={isPublishing}
                            >
                                {isPublishing ? 'Publishing...' : 'Publish Model'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
