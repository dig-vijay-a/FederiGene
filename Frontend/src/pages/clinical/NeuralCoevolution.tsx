import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useWebSocket } from '../../hooks/useWebSocket';

interface NeuralMetrics {
    active_neuro_augmented_clinicians: number;
    neuro_bandwidth_gbps: number;
    avg_consensus_latency_ms: number;
}

interface ConsensusEvent {
    id: string;
    case: string;
    status: string;
    confidence: number;
    participants: number;
}

export default function NeuralCoevolution() {
    usePageTitle('Neural-AI Co-Evolution');
    const { showToast } = useToast();

    const [metrics, setMetrics] = useState<NeuralMetrics | null>(null);
    const [events, setEvents] = useState<ConsensusEvent[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [caseId, setCaseId] = useState('Anomalous Pathway #44');

    const { data: wsData, isConnected } = useWebSocket('/ws/neural');

    useEffect(() => {
        loadNeuralData();
    }, []);

    useEffect(() => {
        if (wsData) {
            if (wsData.metrics) setMetrics(wsData.metrics);
            if (wsData.events) setEvents(wsData.events);
        }
    }, [wsData]);

    const loadNeuralData = () => {
        Promise.all([
            api.get('/neural/metrics'),
            api.get('/neural/consensus/active')
        ]).then(([mRes, eRes]) => {
            setMetrics(mRes.data);
            setEvents(eRes.data.events);
        }).catch(err => console.error("Neural data load failed", err));
    };

    const handleTriggerConsensus = () => {
        setSyncing(true);
        api.post('/neural/consensus/trigger', { case_id: caseId })
            .then(res => {
                showToast(res.data.message, 'success');
                setSyncing(false);
            })
            .catch(() => {
                setSyncing(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧠</span><span className="gradient-text"> Neural-AI Co-Evolution</span></h1>
                <p>The ultimate frontier: Aggregating collective clinical intelligence via BCI to augment diagnostic speed and therapeutic accuracy.</p>
            </div>

            <div className="grid-2">
                {/* Neural Telemetry Overview */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>📡 Neuro-Clinical Telemetry</h3>
                        <span className={`status-badge ${isConnected ? 'active' : ''}`} style={{ fontSize: '0.75rem' }}>
                            {isConnected ? 'LIVE SYNC' : 'CONNECTING...'}
                        </span>
                    </div>

                    {metrics ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #4f46e5', textAlign: 'center', gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Active Neuro-Augmented Clinicians</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{metrics.active_neuro_augmented_clinicians}</div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Neuro Bandwidth</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.neuro_bandwidth_gbps} Gbps</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Consensus Latency</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>{metrics.avg_consensus_latency_ms} ms</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Syncing with clinical neural-net...</div>
                    )}
                </div>

                {/* Collective Intelligence Consensus */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>🤝 Collective Consensus Rounds</h3>
                        <div className="status-badge" style={{ background: '#9333ea', border: 'none' }}>ACTIVE: {events.length}</div>
                    </div>

                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                        Leveraging aggregated cortical signals to achieve real-time clinical consensus on rare and complex medical cases.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        {events.map(event => (
                            <div key={event.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: event.status === 'forming' ? 'rgba(147, 51, 234, 0.05)' : 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>{event.case}</h4>
                                    <span className={`status-badge ${event.status === 'synced' ? 'active' : ''}`}>{event.status.toUpperCase()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                                    <span>Sync Confidence: <strong>{(event.confidence * 100).toFixed(1)}%</strong></span>
                                    <span>Clinicians: {event.participants}</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${event.confidence * 100}%`,
                                        background: 'linear-gradient(90deg, #4f46e5, #9333ea)',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="form-input"
                            value={caseId}
                            onChange={e => setCaseId((e.target as any).value)}
                            placeholder="Rare Case Target..."
                            style={{ flex: 1 }}
                        />
                        <button className="action-btn" onClick={handleTriggerConsensus} disabled={syncing}>
                            {syncing ? 'SYNCING CLINICAL BRAINS...' : 'Trigger Round'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Neuro-Feedback Diagnostics */}
            <div className="content-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(147, 51, 234, 0.05))' }}>
                <h3>👁️ Neuro-Augmented Feedback Loop</h3>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                            Direct BCI-to-AI feedback loop is currently enabling high-speed verification of {caseId}. AI is providing neuro-visual spectral overlays to clinicians to increase diagnostic precision.
                        </p>
                    </div>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#4f46e5, #9333ea, #ec4899, #4f46e5)', opacity: 0.7, boxShadow: '0 0 30px rgba(147, 51, 234, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem', animation: 'spin 10s linear infinite' }}>
                        CORE SYNC
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
