import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function ImmunityFirewall() {
    usePageTitle('Global Immunity Firewall');
    const { showToast } = useToast();

    const [status, setStatus] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [discovering, setDiscovering] = useState(false);
    const [quarantining, setQuarantining] = useState(false);
    const [pathogen, setPathogen] = useState('Anomalous RSV-Prime');

    useEffect(() => {
        loadImmunityData();
        const interval = setInterval(loadImmunityData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadImmunityData = () => {
        Promise.all([
            api.get('/immunity/status'),
            api.get('/immunity/quarantine')
        ]).then(([sRes, qRes]) => {
            setStatus(sRes.data);
            setOrders(qRes.data.orders);
        }).catch(err => console.error("Firewall status load failed", err));
    };

    const handleDiscover = (hubId) => {
        setDiscovering(true);
        api.post('/immunity/discover', { hub_id: hubId, pathogen_name: pathogen })
            .then(res => {
                showToast(res.data.message, 'success');
                setDiscovering(false);
                loadImmunityData();
            })
            .catch(err => {
                showToast("Discovery simulation failed.", 'error');
                setDiscovering(false);
            });
    };

    const handleQuarantine = () => {
        setQuarantining(true);
        api.post('/immunity/quarantine/initiate', { region: 'Southeast Asia Hub', reason: 'High mutation rate in RSV-Prime variant' })
            .then(res => {
                showToast(res.data.message, 'success');
                setQuarantining(false);
                loadImmunityData();
            })
            .catch(err => {
                showToast("Quarantine initiation failed.", 'error');
                setQuarantining(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🛡️</span><span className="gradient-text"> Global Immunity Firewall</span></h1>
                <p>Real-time autonomous biosecurity network. Monitoring global transit hubs and coordinating federated responses to emerging biological threats.</p>
            </div>

            <div className="grid-2">
                {/* Hub Monitoring */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🛫 Autonomous Biosecurity Hubs</h3>
                        <span className="status-badge active">ON-WATCH</span>
                    </div>

                    {status ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {status.hubs_monitoring.map(hub => (
                                <div key={hub.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: hub.threat_level === 'Elevated' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{hub.location}</h4>
                                        <span className={`status-badge ${hub.threat_level === 'Elevated' ? 'critical' : 'active'}`}>
                                            {hub.threat_level}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                        <span style={{ opacity: 0.7 }}>Hub ID: {hub.id}</span>
                                        <button
                                            className="action-btn secondary"
                                            onClick={() => handleDiscover(hub.id)}
                                            disabled={discovering}
                                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                        >
                                            Simulate Discovery
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Syncing with global sentinel...</div>
                    )}
                </div>

                {/* Lockdown & Quarantine Coordination */}
                <div className="content-card">
                    <h3>🤝 Federated Quarantine Coordination</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                        Enforcing sovereign data-driven quarantine orders. Federated nodes collaborate to isolate outbreaks without sharing private traveler identities.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #f59e0b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>Global Lockdown Status</h4>
                                <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>STABLE (42/42 Hubs Unrestricted)</span>
                            </div>
                            <button className="action-btn" onClick={handleQuarantine} disabled={quarantining} style={{ background: '#f59e0b', border: 'none' }}>
                                {quarantining ? 'Syncing Nodes...' : 'Initiate Regional Order'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: '1rem' }}>No active quarantine orders.</div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ fontWeight: 'bold' }}>{order.id}: {order.region}</div>
                                    <div style={{ fontSize: '0.85rem' }}>Reason: {order.reason}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>ENFORCING VIA SMART PROTOCOL</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Pathogen Streaming Status */}
            <div className="content-card" style={{ marginTop: '2rem', background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.05), rgba(79, 70, 229, 0.05))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>📡 Sequence Streaming Status</h3>
                    <span style={{ fontSize: '0.85rem' }}>Throughput: <strong>1.2 PB/s</strong></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {['RNA-Folding', 'Proteomics-Sync', 'Mutation-Predict', 'Vaccine-Docking'].map(process => (
                        <div key={process} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{process}</div>
                            <div style={{ height: '4px', background: 'rgba(0,0,0,0.2)', margin: '0.5rem 0', borderRadius: '2px' }}>
                                <div style={{ height: '100%', width: '85%', background: '#22c55e', borderRadius: '2px' }}></div>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>SYNCED</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
