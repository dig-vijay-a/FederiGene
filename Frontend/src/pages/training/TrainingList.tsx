// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function TrainingList() {
    const navigate = useNavigate();
    usePageTitle('Training Jobs');
    const [jobs, setJobs] = useState<any[]>([]);
    const [datasets, setDatasets] = useState<any[]>([]);
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', model_architecture: 'cnn', target_metric: 'accuracy', privacy_budget: 1.0, total_rounds: 10 });
    const [error, setError] = useState<any>(null);

    const fetchData = (isInitial = false) => {
        if (isInitial) setLoading(true);
        // Fetch training jobs
        api.get('/platform/training')
            .then(res => setJobs(res.data))
            .catch(() => { })
            .finally(() => { if (isInitial) setLoading(false); });

        // Fetch datasets
        api.get('/platform/datasets')
            .then(res => setDatasets(res.data))
            .catch(() => { });
    };

    useEffect(() => { 
        fetchData(true); 
        const interval = setInterval(() => {
            fetchData();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (selectedDatasetIds.length === 0) {
            setError("You must select at least one participating dataset to invite local nodes!");
            return;
        }

        try {
            await api.post('/platform/training', { 
                ...form, 
                privacy_budget: parseFloat(form.privacy_budget), 
                total_rounds: parseInt(form.total_rounds),
                dataset_ids: selectedDatasetIds
            });
            setShowCreate(false);
            setForm({ name: '', description: '', model_architecture: 'cnn', target_metric: 'accuracy', privacy_budget: 1.0, total_rounds: 10 });
            setSelectedDatasetIds([]);
            fetchData();
        } catch (err) { setError(err.response?.data?.detail || 'Failed to create job'); }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><span className="gradient-text">Training Jobs </span><span className="emoji">🧠</span></h1>
                    <p>Create and monitor federated learning training rounds</p>
                </div>
                <button className="action-btn" onClick={() => setShowCreate(!showCreate)} style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                    {showCreate ? '✕ Cancel' : '+ New Job'}
                </button>
            </div>

            {showCreate && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                    <h3>Create Training Job</h3>
                    {error && <div className="error-message" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Job Name</label>
                                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: (e.target as any).value }))} placeholder="e.g., Breast Cancer Classification v2" />
                            </div>
                            <div className="form-group">
                                <label>Model Architecture</label>
                                <select className="form-input" value={form.model_architecture} onChange={e => setForm(f => ({ ...f, model_architecture: (e.target as any).value }))}>
                                    <option value="cnn">CNN</option>
                                    <option value="lstm">LSTM</option>
                                    <option value="transformer">Transformer</option>
                                    <option value="resnet">ResNet</option>
                                    <option value="gnn">Graph Neural Network</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: (e.target as any).value }))} placeholder="Describe the training objective…"></textarea>
                        </div>
                        
                        {/* Dataset Selection Checkboxes */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Select Participating Datasets (Invited Nodes)</label>
                            {datasets.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', opacity: 0.6, color: '#f59e0b' }}>⚠️ No datasets registered yet. Please register a dataset under the Data Catalog first so you can invite its organization to this job.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8, border: '1px solid var(--card-border)', maxHeight: '150px', overflowY: 'auto' }}>
                                    {datasets.map(d => (
                                        <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedDatasetIds.includes(d.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedDatasetIds(prev => [...prev, d.id]);
                                                    } else {
                                                        setSelectedDatasetIds(prev => prev.filter(id => id !== d.id));
                                                    }
                                                }}
                                            />
                                            <span>{d.name} <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>({d.data_type})</span></span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Target Metric</label>
                                <select className="form-input" value={form.target_metric} onChange={e => setForm(f => ({ ...f, target_metric: (e.target as any).value }))}>
                                    <option value="accuracy">Accuracy</option>
                                    <option value="auc">AUC-ROC</option>
                                    <option value="f1">F1 Score</option>
                                    <option value="loss">Loss</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Privacy Budget (ε)</label>
                                <input type="number" step="0.1" min="0.1" value={form.privacy_budget} onChange={e => setForm(f => ({ ...f, privacy_budget: (e.target as any).value }))} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Total Rounds</label>
                            <input type="number" min="1" max="100" value={form.total_rounds} onChange={e => setForm(f => ({ ...f, total_rounds: (e.target as any).value }))} />
                        </div>
                        <button type="submit" className="action-btn" style={{ fontSize: '0.9rem', padding: '10px 24px' }}>Create Training Job →</button>
                    </form>
                </div>
            )}

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : jobs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🧠</div>
                        <p>No training jobs yet. Create one to start federated learning.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th style={{ width: '80px' }}>Job ID</th><th>Name</th><th>Architecture</th><th>Progress</th><th>Metric</th><th>Status</th><th>Created</th>
                        </tr></thead>
                        <tbody>
                            {jobs.map(j => (
                                <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/training/${j.id}`)}>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>#{j.id}</td>
                                    <td style={{ fontWeight: 600 }}>{j.name}</td>
                                    <td><span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>{j.model_architecture.toUpperCase()}</span></td>
                                    <td>{Math.min(j.current_round, j.total_rounds)}/{j.total_rounds} rounds</td>
                                    <td>{j.target_metric || '—'}</td>
                                    <td><span className={`badge badge-${j.status}`}>{j.status}</span></td>
                                    <td style={{ opacity: 0.6, fontSize: '0.82rem' }}>{new Date(j.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
