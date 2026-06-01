import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function UniversalIntelligence() {
    usePageTitle('Universal Intelligence (Singularity)');
    const { showToast } = useToast();

    const [metrics, setMetrics] = useState<any>(null);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [evolving, setEvolving] = useState(false);
    const [proposing, setProposing] = useState(false);
    const [newTarget, setNewTarget] = useState('p53-reactivator');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([
            api.get('/singularity/metrics'),
            api.get('/singularity/discovery')
        ]).then(([mRes, pRes]) => {
            setMetrics(mRes.data);
            setPipelines(pRes.data.pipelines);
        }).catch(err => console.error("Singularity data load failed", err));
    };

    const handleEvolve = () => {
        setEvolving(true);
        api.post('/singularity/evolve')
            .then(res => {
                showToast(res.data.message, 'success');
                setEvolving(false);
                loadData();
            })
            .catch(err => {
                showToast("Self-evolution failed.", 'error');
                setEvolving(false);
            });
    };

    const handlePropose = () => {
        setProposing(true);
        api.post('/singularity/discovery/propose', { target: newTarget })
            .then(res => {
                showToast(res.data.message, 'success');
                setProposing(false);
                setNewTarget('');
                loadData();
            })
            .catch(err => {
                showToast("Proposal failed.", 'error');
                setProposing(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧠</span><span className="gradient-text"> Universal Medical Intelligence (The Singularity)</span></h1>
                <p>The pinnacle of FederiGene: A self-evolving, federated MoE model that autonomously refactors its own architecture and discover new cures.</p>
            </div>

            <div className="grid-2">
                {/* Singularity Health & Evolution */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🌐 Global Brain Synaptic State</h3>
                        <span className="status-badge active" style={{ fontSize: '0.75rem' }}>SELF-AWARE</span>
                    </div>

                    {metrics ? (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '0.5rem' }}>Global Synaptic Density</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)', textShadow: '0 0 10px rgba(79, 70, 229, 0.4)' }}>
                                    {(metrics.global_synaptic_density * 100).toFixed(2)}%
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>Phase: {metrics.evolution_phase}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Inference Latency</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{metrics.avg_inference_latency_ms}ms</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Active Expert Modules</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.mixtures_of_experts_active}</div>
                                </div>
                            </div>

                            <button
                                className="action-btn"
                                onClick={handleEvolve}
                                disabled={evolving}
                                style={{ width: '100%', background: 'linear-gradient(90deg, #4f46e5, #9333ea)', height: '50px', fontSize: '1rem' }}
                            >
                                {evolving ? 'Refactoring Global Weights...' : '⚡ Trigger Self-Evolution Round'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Syncing with global brain...</div>
                    )}
                </div>

                {/* Autonomous Drug Discovery */}
                <div className="content-card">
                    <h3>🧪 Drug Discovery Pipeline</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        The Singularity model autonomously scans global protein data to propose and screen novel therapeutic candidates.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        {pipelines.map(pipe => (
                            <div key={pipe.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'rgba(34, 197, 94, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{pipe.target}</h4>
                                    <span className="status-badge" style={{ background: '#22c55e' }}>{pipe.status.replace(/_/g, ' ').toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Candidates Found: <strong>{pipe.candidate_molecules}</strong></div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Propose Discovery Focus</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                className="form-input"
                                value={newTarget}
                                onChange={e => setNewTarget((e.target as any).value)}
                                style={{ flex: 1 }}
                                placeholder="Target Protein/Pathway..."
                            />
                            <button className="action-btn" onClick={handlePropose} disabled={proposing}>
                                {proposing ? 'Analyzing...' : 'Execute'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
