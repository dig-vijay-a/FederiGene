import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function ModelRegistry() {
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State - Publish
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [publishModelId, setPublishModelId] = useState<number | null>(null);
    const [publishName, setPublishName] = useState('');
    const [publishArchitecture, setPublishArchitecture] = useState('');
    const [publishSpecialty, setPublishSpecialty] = useState('');
    const [publishDesc, setPublishDesc] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);

    // Modal State - Inference Prediction
    const [predictModalOpen, setPredictModalOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<any>(null);
    const [features, setFeatures] = useState<number[]>([5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0]);
    const [predictResult, setPredictResult] = useState<any>(null);
    const [predictLoading, setPredictLoading] = useState(false);

    const GENE_LABELS = [
        "BRCA1_exp", "TP53_exp", "EGFR_exp", "PTEN_exp", 
        "MYC_exp", "KRAS_exp", "PIK3CA_exp", "RB1_exp", 
        "CDKN2A_exp", "ATM_exp"
    ];

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

    const handleDownloadWeights = async (modelId: number, version: string) => {
        try {
            showToast(`Downloading weights for ${version}...`, 'info');
            const res = await api.get(`/platform/models/${modelId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `federigene_model_${version}.pt`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            showToast(`Model ${version} weights (.pt) downloaded!`, 'success');
        } catch (err: any) {
            showToast('Failed to download model weights.', 'error');
        }
    };

    const openPredictModal = (m: any) => {
        setSelectedModel(m);
        setPredictResult(null);
        // Default to a realistic balanced profile
        setFeatures([5.2, 4.8, 3.9, 6.1, 4.5, 3.8, 5.1, 4.2, 5.5, 4.9]);
        setPredictModalOpen(true);
    };

    const loadSamplePatient = (type: 'high_risk' | 'healthy') => {
        if (type === 'high_risk') {
            // Low BRCA1 (<3.0) and high TP53 (>7.0) correlates with oncology disease phenotype
            setFeatures([1.82, 8.94, 6.45, 2.11, 7.89, 8.12, 5.43, 3.21, 6.78, 2.45]);
        } else {
            // High/Normal BRCA1, moderate TP53
            setFeatures([7.85, 3.12, 2.74, 8.02, 4.09, 2.14, 4.69, 8.59, 6.83, 8.68]);
        }
        setPredictResult(null);
    };

    const handleRunInference = async () => {
        if (!selectedModel) return;
        setPredictLoading(true);
        try {
            const res = await api.post(`/platform/models/${selectedModel.id}/predict`, { features });
            setPredictResult(res.data);
            showToast('PyTorch AI inference completed!', 'success');
        } catch (err: any) {
            showToast('Inference execution failed.', 'error');
        } finally {
            setPredictLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Model Registry </span><span className="emoji">📦</span></h1>
                <p>Track trained federated model versions, download aggregated PyTorch weights, and run disease predictions</p>
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
                                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{m.job_name || "Federated Oncology Predictor"}</span>
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
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                                            <button
                                                onClick={() => handleDownloadWeights(m.id, m.version)}
                                                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', color: '#3b82f6', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                                                title="Download PyTorch model weights (.pt)"
                                            >
                                                📥 Download (.pt)
                                            </button>

                                            <button
                                                onClick={() => openPredictModal(m)}
                                                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                                                title="Test disease prediction using this model"
                                            >
                                                🔮 Predict
                                            </button>

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
                                                    style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.35)', color: '#eab308', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
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

            {/* Predict Inference Modal */}
            {predictModalOpen && selectedModel && (
                <div className="modal-overlay" onClick={() => setPredictModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h2>🔮 Real-Time Disease Prediction</h2>
                            <button 
                                onClick={() => setPredictModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '1.4rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                        <p style={{ opacity: 0.8, fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                            Model: <strong>{selectedModel.job_name}</strong> | Version: <strong>{selectedModel.version}</strong> (PyTorch FedAvg Aggregated Weights)
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                            <button 
                                className="action-btn"
                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.82rem', padding: '6px 14px' }}
                                onClick={() => loadSamplePatient('high_risk')}
                            >
                                ⚠️ Load High-Risk Patient Sample
                            </button>
                            <button 
                                className="action-btn"
                                style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', fontSize: '0.82rem', padding: '6px 14px' }}
                                onClick={() => loadSamplePatient('healthy')}
                            >
                                ✅ Load Healthy Patient Sample
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.2rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.9 }}>
                                🧬 Normalized Patient Gene Expression Levels (TPM / RPKM: 0.0 - 10.0)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                                {GENE_LABELS.map((label, idx) => (
                                    <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: 2 }}>{label.replace('_exp', '')}</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="10"
                                            value={features[idx]}
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = [...features];
                                                updated[idx] = val;
                                                setFeatures(updated);
                                            }}
                                            style={{
                                                padding: '6px 8px',
                                                fontSize: '0.82rem',
                                                background: 'var(--card-bg, #1a1a24)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 4,
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
                            <button 
                                className="action-btn" 
                                style={{ flex: 1, background: '#10b981', padding: '10px' }}
                                onClick={handleRunInference}
                                disabled={predictLoading}
                            >
                                {predictLoading ? '🧠 Running PyTorch Inference...' : '🚀 Predict Disease Risk'}
                            </button>
                        </div>

                        {predictResult && (
                            <div style={{
                                padding: '1.2rem',
                                borderRadius: 8,
                                border: `1px solid ${predictResult.predicted_class === 1 ? '#ef4444' : '#22c55e'}`,
                                background: predictResult.predicted_class === 1 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: predictResult.predicted_class === 1 ? '#ef4444' : '#22c55e' }}>
                                        {predictResult.classification}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                        Model: {predictResult.version}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Healthy Probability</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>{predictResult.healthy_probability}%</div>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Disease Risk Probability</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: predictResult.disease_probability > 50 ? '#ef4444' : '#f59e0b' }}>
                                            {predictResult.disease_probability}%
                                        </div>
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.75rem', opacity: 0.65, margin: 0 }}>
                                    Inference completed using the downloaded/federated PyTorch weights. Individual clinical patient records remain decentralized and protected.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
