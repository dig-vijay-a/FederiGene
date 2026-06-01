import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function MultiModalIQ() {
    usePageTitle('Multi-Modal Intelligence');
    const { showToast } = useToast();

    // Real Backend Data
    const [models, setModels] = useState<any[]>([]);
    const [orgs, setOrgs] = useState<any[]>([]);

    // Knowledge Distillation State
    const [teacherModel, setTeacherModel] = useState('');
    const [studentNode, setStudentNode] = useState('');
    const [distillModalities, setDistillModalities] = useState({ genomics: true, radiology: true, pathology: false });
    const [distilling, setDistilling] = useState(false);
    const [jobId, setJobId] = useState<any>(null);
    const [jobStatus, setJobStatus] = useState<any>(null);

    // GNN Map State
    const [datasets, setDatasets] = useState<any[]>([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [gnnData, setGnnData] = useState<any>(null);
    const [loadingGnn, setLoadingGnn] = useState(false);

    // Fetch real data on load
    useEffect(() => {
        api.get('/platform/models')
            .then(res => {
                setModels(res.data);
                if (res.data.length > 0) setTeacherModel(res.data[0].id);
            })
            .catch(err => console.error(err));

        api.get('/platform/orgs')
            .then(res => {
                setOrgs(res.data);
                if (res.data.length > 0) setStudentNode(res.data[0].name);
            })
            .catch(err => console.error(err));
            
        api.get('/platform/datasets')
            .then(res => {
                setDatasets(res.data);
                if (res.data.length > 0) setSelectedDatasetId(res.data[0].id);
            })
            .catch(err => console.error(err));
    }, []);

    // Poll Distillation Status
    useEffect(() => {
        let interval;
        if (jobId && jobStatus?.status !== 'completed') {
            interval = setInterval(() => {
                api.get(`/multimodal/distill/${jobId}`)
                    .then(res => {
                        setJobStatus(res.data);
                        if (res.data.status === 'completed') {
                            setDistilling(false);
                            clearInterval(interval);
                        }
                    })
                    .catch(e => {
                        console.error("Job tracking failed", e);
                        clearInterval(interval);
                        setDistilling(false);
                    });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [jobId, jobStatus]);

    const handleStartDistillation = () => {
        setDistilling(true);
        setJobStatus(null);

        const activeModalities = Object.keys(distillModalities).filter(k => distillModalities[k]);

        api.post('/multimodal/distill', {
            teacher_model: teacherModel.toString(),
            student_node: studentNode,
            modalities: activeModalities
        })
            .then(res => setJobId(res.data.job_id))
            .catch(() => {
                showToast('Failed to start distillation.', 'error');
                setDistilling(false);
            });
    };

    const loadGnnMap = () => {
        if (!selectedDatasetId) {
            showToast("Please select a dataset.", 'error');
            return;
        }
        setLoadingGnn(true);
        api.get(`/multimodal/gnn/map/${selectedDatasetId}`)
            .then(res => setGnnData(res.data))
            .catch(() => showToast("Failed to load GNN map", 'error'))
            .finally(() => setLoadingGnn(false));
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧠</span><span className="gradient-text"> Multi-Modal IQ (Genomics + DICOM + WSI)</span></h1>
                <p>Integrate diverse datatypes using Graph Neural Networks and deploy massive cross-silo intelligence to small edge nodes via Knowledge Distillation.</p>
            </div>

            <div className="grid-2">
                {/* Cross-Silo Knowledge Distillation */}
                <div className="content-card">
                    <h3>Cross-Silo Knowledge Distillation</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Train a small 'Student' model using soft-labels (logits) from a massive 'Teacher' model, overcoming architectural and hardware silos.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Teacher Model (Global Leader)</label>
                        <select className="form-input" value={teacherModel} onChange={e => setTeacherModel((e.target as any).value)}>
                            {models.length === 0 && <option value="">Loading Models...</option>}
                            {models.map(m => (
                                <option key={m.id} value={m.id}>
                                    Model {m.version} (Job #{m.job_id}) - Acc: {(m.accuracy * 100).toFixed(1)}%
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Student Node (Edge Receiver)</label>
                        <select className="form-input" value={studentNode} onChange={e => setStudentNode((e.target as any).value)}>
                            {orgs.length === 0 && <option value="">Loading Organizations...</option>}
                            {orgs.map(o => (
                                <option key={o.id} value={o.name}>
                                    {o.name} ({o.org_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Target Modalities</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {Object.entries(distillModalities).map(([modality, isActive]) => (
                                <label key={modality} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => setDistillModalities(prev => ({ ...prev, [modality]: !isActive }))}
                                    />
                                    {modality}
                                </label>
                            ))}
                        </div>
                    </div>

                    <button className="action-btn" onClick={handleStartDistillation} disabled={distilling} style={{ width: '100%', background: '#8b5cf6' }}>
                        {distilling ? 'Distilling Knowledge...' : '🔥 Start KD Transfer Job'}
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

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.9 }}>
                                <span>KL-Divergence: <strong style={{ color: '#eab308' }}>{jobStatus.metrics.kl_divergence.toFixed(2)}</strong></span>
                                <span>Student Acc: <strong style={{ color: '#22c55e' }}>{(jobStatus.metrics.student_accuracy * 100).toFixed(1)}%</strong></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Graph Neural Network (GNN) */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>GNN Structural Map</h3>
                        <span className="table-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Cross-Modal Attention</span>
                    </div>

                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Visualize how the Graph Neural Network correlates features in your federated dataset.
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <select className="form-input" style={{ flex: 1 }} value={selectedDatasetId} onChange={e => setSelectedDatasetId((e.target as any).value)}>
                            {datasets.length === 0 && <option value="">Loading Datasets...</option>}
                            {datasets.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <button className="action-btn secondary" onClick={loadGnnMap} disabled={loadingGnn || !selectedDatasetId}>
                            🗺️ Generate Map
                        </button>
                    </div>

                    {gnnData && (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ Clinical Insight Discovered</div>
                                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>{gnnData.clinical_insight}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Entity Nodes</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', opacity: 0.8 }}>
                                        {gnnData.graph.nodes.map(n => (
                                            <li key={n.id}><strong>{n.id}</strong> ({n.group})</li>
                                        ))}
                                    </ul>
                                </div>
                                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Multi-Modal Attention</h4>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span>Genomics → Radiology:</span>
                                            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{(gnnData.attention_scores.Genomics_to_Radiology * 100).toFixed(1)}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span>Pathology → Genomics:</span>
                                            <span style={{ color: '#eab308', fontWeight: 'bold' }}>{(gnnData.attention_scores.Pathology_to_Genomics * 100).toFixed(1)}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span>Radiology → Pathology:</span>
                                            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{(gnnData.attention_scores.Radiology_to_Pathology * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!gnnData && !loadingGnn && (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                            Enter a Patient ID directly tied to multi-modal datasets to view the latent graph representation.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
