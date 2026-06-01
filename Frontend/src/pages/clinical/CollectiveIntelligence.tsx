import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function CollectiveIntelligence() {
    usePageTitle('Collective Intelligence');
    const { showToast } = useToast();

    const [metrics, setMetrics] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [rounds, setRounds] = useState<any[]>([]);
    const [initializing, setInitializing] = useState(false);
    const [voting, setVoting] = useState(false);
    const [hypothesis, setHypothesis] = useState('Anomalous Neural Pattern Detected in Locus-9');

    useEffect(() => {
        loadCollectiveData();
        const interval = setInterval(loadCollectiveData, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadCollectiveData = () => {
        Promise.all([
            api.get('/collective/metrics'),
            api.get('/collective/hologram/sessions'),
            api.get('/collective/consensus/history')
        ]).then(([mRes, sRes, rRes]) => {
            setMetrics(mRes.data);
            setSessions(sRes.data.sessions);
            setRounds(rRes.data.rounds);
        }).catch(err => console.error("Collective data load failed", err));
    };

    const handleHoloSession = () => {
        setInitializing(true);
        api.post('/collective/hologram/initiate', { patient_id: 'P-9901', specialist_ids: ['D-01', 'D-02', 'D-05'] })
            .then(res => {
                showToast(res.data.message, 'success');
                setInitializing(false);
                loadCollectiveData();
            })
            .catch(err => {
                showToast("Holo init failed.", 'error');
                setInitializing(false);
            });
    };

    const handleConsensus = () => {
        setVoting(true);
        api.post('/collective/consensus/start', { case_id: 'CASE-ALPHA-01', hypothesis: hypothesis })
            .then(res => {
                showToast(res.data.message, 'success');
                setVoting(false);
                loadCollectiveData();
            })
            .catch(err => {
                showToast("Consensus start failed.", 'error');
                setVoting(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧠</span><span className="gradient-text"> Zero-Latency Collective Intelligence</span></h1>
                <p>Establishing an instantaneous global clinical nervous system. Real-time holographic consultations and direct neural-link consensus for high-stakes diagnostics.</p>
            </div>

            <div className="grid-2">
                {/* Network Metrics */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🛡️ Global Bio-Sync Status</h3>
                        <span className="status-badge active" style={{ background: '#6366f1', border: 'none' }}>LATENCY: {metrics?.average_network_latency}</span>
                    </div>

                    {metrics ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #6366f1', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Active Neural Links</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{(metrics.active_neural_connections / 1000000).toFixed(2)}M</div>
                            </div>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid #22c55e', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Collective IQ Gain</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{metrics.collective_iq_gain}</div>
                            </div>

                            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                                <h4>Regional Sync Nodes</h4>
                                {metrics.nodes.map(node => (
                                    <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                        <span>{node.region}</span>
                                        <span style={{ color: node.latency_ms < 0.1 ? '#22c55e' : '#f59e0b' }}>{node.latency_ms}ms</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Synchronizing synaptic network...</div>
                    )}
                </div>

                {/* Holographic Consultations */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>📽️ Active Holographic Links</h3>
                        <button className="action-btn" onClick={handleHoloSession} disabled={initializing} style={{ background: '#6366f1', border: 'none' }}>
                            {initializing ? 'Syncing...' : 'Start New Session'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No active holographic consultations.</div>
                        ) : (
                            sessions.map(sess => (
                                <div key={sess.id} style={{ border: '1px solid #6366f1', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <strong>Session: {sess.id}</strong>
                                        <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>● {sess.stream_quality}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Patient Twin: <code>{sess.patient_twin_ref}</code></div>
                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Specialists: {sess.participants.join(', ')}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Neural Consensus Rounds */}
            <div className="content-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>🌐 Neural-Link Consensus History</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '600px', marginLeft: '2rem' }}>
                        <input
                            className="form-input"
                            value={hypothesis}
                            onChange={e => setHypothesis((e.target as any).value)}
                            style={{ flex: 1 }}
                        />
                        <button className="action-btn" onClick={handleConsensus} disabled={voting}>
                            {voting ? 'Broadcasting...' : 'Broaden Consensus'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {rounds.map(rnd => (
                        <div key={rnd.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{rnd.case_id}</span>
                                <span className={`status-badge ${rnd.status === 'validated' ? 'active' : 'warning'}`}>{rnd.status.toUpperCase()}</span>
                            </div>
                            <p style={{ margin: '0 0 1.5rem 0', fontWeight: 'bold' }}>{rnd.hypothesis}</p>
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Agreement Rate: <strong>{(rnd.agreement_rate * 100).toFixed(1)}%</strong></div>
                            <div style={{ height: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${rnd.agreement_rate * 100}%`,
                                    background: rnd.status === 'validated' ? '#22c55e' : '#6366f1',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
