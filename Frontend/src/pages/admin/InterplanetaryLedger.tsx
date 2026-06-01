import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function InterplanetaryLedger() {
    usePageTitle('Interplanetary Ledger');
    const { showToast } = useToast();

    const [nodes, setNodes] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [newTraveler, setNewTraveler] = useState({ name: '', home_world: 'Earth' });

    useEffect(() => {
        loadNodes();
    }, []);

    const loadNodes = () => {
        api.get('/interplanetary/nodes')
            .then(res => setNodes(res.data.nodes))
            .catch(err => console.error("Space nodes load failed", err));
    };

    const handleSync = () => {
        setSyncing(true);
        api.post('/interplanetary/sync', { model_id: 'singularity_v1.0' })
            .then(res => {
                showToast(res.data.message, 'success');
                setSyncing(false);
            })
            .catch(err => {
                showToast("Deep space sync failed.", 'error');
                setSyncing(false);
            });
    };

    const handleRegister = () => {
        if (!newTraveler.name) return;
        setRegistering(true);
        api.post('/interplanetary/bio-id/register', newTraveler)
            .then(res => {
                showToast(`Bio-ID Registered: ${res.data.bio_id}`, 'success');
                setRegistering(false);
                setNewTraveler({ name: '', home_world: 'Earth' });
            })
            .catch(err => {
                showToast("Registration failed.", 'error');
                setRegistering(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🚀</span><span className="gradient-text"> Interplanetary Medical Ledger</span></h1>
                <p>Extending the federated network to the stars. Synchronizing clinical weights across planetary boundaries with Starlink-optimized latency management.</p>
            </div>

            <div className="grid-2">
                {/* Extra-Terrestrial Nodes */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🛰️ Off-World Federated Nodes</h3>
                        <span className="status-badge active" style={{ fontSize: '0.75rem' }}>CONNECTED TO DSN</span>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {nodes.map(node => (
                            <div key={node.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{node.location}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>{node.id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.8 }}>
                                    <span>One-way Latency: <strong>{node.latency_ms >= 1000 ? `${(node.latency_ms / 1000 / 60).toFixed(1)} mins` : `${node.latency_ms}ms`}</strong></span>
                                    <span style={{ color: '#22c55e' }}>● {node.status.toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="action-btn"
                        onClick={handleSync}
                        disabled={syncing}
                        style={{ width: '100%', marginTop: '1.5rem', background: 'linear-gradient(45deg, #0ea5e9, #6366f1)' }}
                    >
                        {syncing ? 'Beaming Weights to Mars...' : '📡 Beam Global Model Weights'}
                    </button>
                </div>

                {/* Universal Bio-ID Registration */}
                <div className="content-card">
                    <h3>🆔 Universal Bio-ID (Interplanetary)</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Generate a cryptographically-anchored biological identity that persists across planetary systems and Starlink relays.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', opacity: 0.7 }}>Traveler Full Name</label>
                            <input
                                className="form-input"
                                value={newTraveler.name}
                                onChange={e => setNewTraveler({ ...newTraveler, name: (e.target as any).value })}
                                placeholder="e.g. Elena Vance"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', opacity: 0.7 }}>Home World</label>
                            <select
                                className="form-input"
                                value={newTraveler.home_world}
                                onChange={e => setNewTraveler({ ...newTraveler, home_world: (e.target as any).value })}
                            >
                                <option value="Earth">Earth</option>
                                <option value="Mars">Mars</option>
                                <option value="Luna">Luna</option>
                                <option value="ISS">ISS / Orbital</option>
                            </select>
                        </div>
                        <button className="action-btn" onClick={handleRegister} disabled={registering} style={{ marginTop: '0.5rem' }}>
                            {registering ? 'Securing Biological ID...' : 'Register Universal Bio-ID'}
                        </button>
                    </div>

                    <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                        <strong>⚠️ DISCONNECTED MODE ACTIVE:</strong> These IDs use a holographic local consensus when Starlink links are severed by planetary occlusion.
                    </div>
                </div>
            </div>
        </div>
    );
}
