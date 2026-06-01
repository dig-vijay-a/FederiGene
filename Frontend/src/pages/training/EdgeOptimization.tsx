import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function EdgeOptimization() {
    usePageTitle('Edge AI Optimization');
    const { showToast } = useToast();

    // Compression State
    const [modelId, setModelId] = useState('global_model_v1.2.8');
    const [quantization, setQuantization] = useState('INT8');
    const [pruningRatio, setPruningRatio] = useState(0.3);
    const [compressing, setCompressing] = useState(false);
    const [jobId, setJobId] = useState<any>(null);
    const [jobStatus, setJobStatus] = useState<any>(null);

    // FedAsync State
    const [nodeId, setNodeId] = useState('HospNode-Edge-44');
    const [staleness, setStaleness] = useState(5);
    const [asyncConfigMsg, setAsyncConfigMsg] = useState<any>(null);

    // Setup polling for compression job
    useEffect(() => {
        let interval;
        if (jobId && jobStatus?.status !== 'completed') {
            interval = setInterval(() => {
                api.get(`/edge/compress/${jobId}`)
                    .then(res => {
                        setJobStatus(res.data);
                        if (res.data.status === 'completed') {
                            setCompressing(false);
                            clearInterval(interval);
                        }
                    })
                    .catch(err => {
                        console.error('Failed to poll status', err);
                        setCompressing(false);
                        clearInterval(interval);
                    });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [jobId, jobStatus]);

    const handleCompress = () => {
        setCompressing(true);
        setJobStatus(null);
        api.post('/edge/compress', {
            model_id: modelId,
            target_device: 'cpu_standard',
            quantization: quantization,
            pruning_ratio: pruningRatio
        })
            .then(res => setJobId(res.data.job_id))
            .catch(err => {
                showToast('Failed to start compression job.', 'error');
                setCompressing(false);
            });
    };

    const handleConfigureAsync = () => {
        api.post('/edge/fedasync/configure', {
            node_id: nodeId,
            staleness_tolerance: staleness
        })
            .then(res => setAsyncConfigMsg(res.data))
            .catch(err => showToast("Configuration failed.", 'error'));
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">⚡</span><span className="gradient-text"> Edge AI Optimization</span></h1>
                <p>Prepare global models for deployment on resource-constrained hospital workstations using pruning, quantization, and asynchronous pipelines.</p>
            </div>

            <div className="grid-2">
                {/* Model Compression */}
                <div className="content-card">
                    <h3>Model Pruning & Quantization</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Compress large global parameters down to lightweight `.tflite` or ONNX formats.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Model</label>
                        <select className="form-input" value={modelId} onChange={e => setModelId((e.target as any).value)}>
                            <option value="global_model_v1.2.8">Oncology Genomics (Global v1.2.8)</option>
                            <option value="global_model_v2.0.1">Cardiology Prediction (Global v2.0.1)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantization</label>
                            <select className="form-input" value={quantization} onChange={e => setQuantization((e.target as any).value)}>
                                <option value="FP16">Float16 (Light)</option>
                                <option value="INT8">Int8 (Standard Edge)</option>
                                <option value="INT4">Int4 (Extreme Compression)</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Pruning Sparsity: {(pruningRatio * 100).toFixed(0)}%</label>
                            <input
                                type="range" min="0" max="0.8" step="0.1"
                                value={pruningRatio} onChange={e => setPruningRatio(parseFloat((e.target as any).value))}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>

                    <button className="action-btn" onClick={handleCompress} disabled={compressing} style={{ width: '100%', marginTop: '1rem' }}>
                        {compressing ? 'Compressing Model...' : '🗜️ Start Compression Job'}
                    </button>

                    {jobStatus && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong>Status:</strong>
                                <span style={{ textTransform: 'capitalize', color: 'var(--primary-color)' }}>
                                    {jobStatus.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(0,0,0,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{ width: `${jobStatus.progress}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.5s ease' }}></div>
                            </div>

                            {jobStatus.status === 'completed' && (
                                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>Original Size:</span> <strong>{jobStatus.original_size}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#22c55e' }}>
                                        <span>Edge Optimized Size:</span> <strong>{jobStatus.optimized_size}</strong>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                        <button className="action-btn" style={{ background: '#22c55e', padding: '0.5rem 1rem' }} onClick={() => showToast("Simulation: Downloading optimized .tflite weights", 'info')}>
                                            ⬇️ Download Edge Bundle
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FedAsync Configuration */}
                <div className="content-card">
                    <h3>FedAsync Configuration</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Configure asynchronous federated optimization logic to support nodes with slow CPU compute or intermittent connectivity.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Edge Node ID</label>
                        <input type="text" className="form-input" value={nodeId} onChange={e => setNodeId((e.target as any).value)} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Staleness Tolerance (Epochs): {staleness}</label>
                        <input type="range" min="1" max="20" value={staleness} onChange={e => setStaleness(parseInt((e.target as any).value))} style={{ width: '100%' }} />
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>How old an incoming gradient can be before the aggregator rejects it.</span>
                    </div>

                    <button className="action-btn secondary" onClick={handleConfigureAsync} style={{ width: '100%' }}>
                        ⏱️ Apply FedAsync Protocol
                    </button>

                    {asyncConfigMsg && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '4px', fontSize: '0.9rem' }}>
                            <strong>Success:</strong> {asyncConfigMsg.message} <br />
                            <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>Node {asyncConfigMsg.node} running via {asyncConfigMsg.protocol}. Penalty decay active.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
