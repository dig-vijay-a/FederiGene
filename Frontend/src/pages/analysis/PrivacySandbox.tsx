import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function PrivacySandbox() {
    usePageTitle('Privacy Sandbox & Synthetic Data');
    const { showToast } = useToast();
    const [dpMetrics, setDpMetrics] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Real Datasets State
    const [datasets, setDatasets] = useState<any[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState('');

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [jobId, setJobId] = useState<any>(null);
    const [jobStatus, setJobStatus] = useState<any>(null);
    const [epsilon, setEpsilon] = useState(1.5);
    const [numSamples, setNumSamples] = useState(500);

    useEffect(() => {
        // Load DP Calibration Metrics
        api.get('/synthetic/dp/metrics')
            .then(res => setDpMetrics(res.data))
            .catch(err => console.error("Failed to load DP metrics", err));

        // Load Real Datasets
        api.get('/platform/datasets')
            .then(res => {
                setDatasets(res.data);
                if (res.data.length > 0) {
                    setSelectedDatasetId(res.data[0].id);
                }
            })
            .catch(err => console.error("Failed to load datasets", err));
    }, []);

    useEffect(() => {
        if (selectedDatasetId) {
            loadPreview(selectedDatasetId);
        }
    }, [selectedDatasetId]);

    useEffect(() => {
        let interval;
        if (jobId && jobStatus?.status !== 'completed') {
            interval = setInterval(() => {
                api.get(`/synthetic/job/${jobId}`)
                    .then(res => {
                        setJobStatus(res.data);
                        if (res.data.status === 'completed') {
                            setGenerating(false);
                        }
                    })
                    .catch(e => {
                        console.error("Job tracking failed");
                        clearInterval(interval);
                        setGenerating(false);
                    });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [jobId, jobStatus]);

    const loadPreview = (dsId) => {
        setLoadingPreview(true);
        api.get(`/synthetic/preview?samples=5&dataset_id=${dsId || selectedDatasetId}`)
            .then(res => setPreviewData(res.data))
            .catch(err => console.error("Failed to load preview", err))
            .finally(() => setLoadingPreview(false));
    };

    const handleGenerate = () => {
        if (!selectedDatasetId) {
            showToast("Please select a dataset first.", 'error');
            return;
        }
        setGenerating(true);
        setJobStatus(null);
        api.post('/synthetic/generate', { dataset_id: parseInt(selectedDatasetId), num_samples: numSamples, epsilon: epsilon })
            .then(res => {
                setJobId(res.data.job_id);
            })
            .catch(err => {
                console.error("Failed to start generation", err);
                setGenerating(false);
                showToast("Failed to start generation. Make sure backend is running.", 'error');
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧪</span><span className="gradient-text"> Privacy Sandbox & Synthetic Twins</span></h1>
                <p>Generate privacy-preserving synthetic cohorts using Federated GANs. Run local models before launching global training jobs.</p>
            </div>

            <div className="grid-2">
                <div className="content-card">
                    <h3>Genomic Data Synthesizer</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Configure the global generator parameters to produce a synthetic dataset.
                        Lower epsilon (ε) increases privacy by adding more noise, but reduces data fidelity.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Target Dataset
                        </label>
                        <select 
                            className="form-input" 
                            value={selectedDatasetId} 
                            onChange={(e) => setSelectedDatasetId((e.target as any).value)}
                        >
                            {datasets.length === 0 ? (
                                <option value="">Loading datasets...</option>
                            ) : (
                                datasets.map(ds => (
                                    <option key={ds.id} value={ds.id}>
                                        {ds.name} ({ds.row_count} records)
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Number of Samples to Generate: <strong>{numSamples}</strong>
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="10000"
                            step="100"
                            value={numSamples}
                            onChange={(e) => setNumSamples(parseInt((e.target as any).value))}
                            style={{ width: '100%', cursor: 'pointer' }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Differential Privacy Budget (Epsilon ε): <strong>{epsilon}</strong>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="10.0"
                            step="0.1"
                            value={epsilon}
                            onChange={(e) => setEpsilon(parseFloat((e.target as any).value))}
                            style={{ width: '100%', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>
                            <span>High Privacy (Lower Fidelity)</span>
                            <span>Low Privacy (Higher Fidelity)</span>
                        </div>
                    </div>

                    <button
                        className="action-btn"
                        onClick={handleGenerate}
                        disabled={generating}
                        style={{ width: '100%', padding: '12px' }}
                    >
                        {generating ? 'Job Running...' : '🚀 Generate Synthetic Twin Cohort'}
                    </button>

                    {jobStatus && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong>Status:</strong>
                                <span style={{ textTransform: 'capitalize', color: 'var(--primary-color)' }}>
                                    {jobStatus.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(0,0,0,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${jobStatus.progress}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.5s ease' }}></div>
                            </div>

                            {jobStatus.status === 'completed' && jobStatus.download_url && (
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <a 
                                        href={jobStatus.download_url}
                                        download
                                        className="action-btn" 
                                        style={{ background: '#22c55e', textDecoration: 'none', display: 'inline-block' }} 
                                    >
                                        ⬇️ Download CSV File
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>DP Calibration Matrix</h3>
                        <span className="table-badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>Live Metrics</span>
                    </div>

                    {dpMetrics && (
                        <div className="table-container" style={{ marginBottom: '2rem' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Epsilon (ε)</th>
                                        <th>Fidelity Score</th>
                                        <th>Vulnerability Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dpMetrics.historical_tradeoffs.map((metric, i) => (
                                        <tr key={i} style={{ background: Math.abs(epsilon - metric.epsilon) < 0.3 ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }}>
                                            <td>{metric.epsilon.toFixed(1)}</td>
                                            <td>{(metric.fidelity * 100).toFixed(0)}% Match</td>
                                            <td>
                                                <div style={{ width: '60px', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
                                                    <div style={{ width: `${metric.vulnerability_score * 100}%`, background: metric.vulnerability_score > 0.5 ? '#ef4444' : metric.vulnerability_score > 0.2 ? '#eab308' : '#22c55e', height: '100%', borderRadius: '3px' }}></div>
                                                </div>
                                                {(metric.vulnerability_score * 100).toFixed(0)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Data Preview (Synthetic Samples)</h3>
                        <button className="action-btn secondary" onClick={loadPreview} disabled={loadingPreview} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                            🔄 Regen
                        </button>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', color: '#a1a1aa' }}>
                        {loadingPreview ? (
                            "Sampling GAN latent space..."
                        ) : (
                            <pre style={{ margin: 0 }}>
                                {JSON.stringify(previewData, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
