// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function EternalGuardian() {
    usePageTitle('The Eternal Guardian');
    const { showToast } = useToast();

    const [status, setStatus] = useState<any>(null);
    const [corrections, setCorrections] = useState<any[]>([]);
    const [pulsing, setPulsing] = useState(false);
    const [stabilizing, setStabilizing] = useState(false);

    useEffect(() => {
        loadGuardianData();
        const interval = setInterval(loadGuardianData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadGuardianData = () => {
        Promise.all([
            api.get('/guardian/status'),
            api.get('/guardian/corrections')
        ]).then(([sRes, cRes]) => {
            setStatus(sRes.data);
            setCorrections(cRes.data.corrections);
        }).catch(err => console.error("Guardian synchronization failed", err));
    };

    const handlePulse = () => {
        setPulsing(true);
        api.post('/guardian/pulse')
            .then(res => {
                showToast(res.data.message, 'success');
                setPulsing(false);
                loadGuardianData();
            })
            .catch(err => {
                showToast("Equilibrium pulse failed.", 'error');
                setPulsing(false);
            });
    };

    const handleStabilize = () => {
        setStabilizing(true);
        api.post('/guardian/repair/stabilize')
            .then(res => {
                showToast(res.data.message, 'success');
                setStabilizing(false);
            })
            .catch(err => {
                showToast("Repair stabilization failed.", 'error');
                setStabilizing(false);
            });
    };

    return (
        <div style={{ background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.05), transparent)', minHeight: '100vh', padding: '1rem' }}>
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '3rem', letterSpacing: '2px', color: '#10b981' }}>💎 The Eternal Guardian</h1>
                <p style={{ maxWidth: '800px', margin: '1rem auto', fontSize: '1.1rem', opacity: 0.8 }}>
                    Universal Biological Equilibrium. The platform has become the ecosystem. Self-correcting autonomous health monitoring for the entire human race.
                </p>
            </div>

            <div className="grid-2">
                {/* Global Equilibrium Dashboard */}
                <div className="content-card" style={{ border: '2px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3>🌐 Universal Equilibrium State</h3>
                        <span className="status-badge active" style={{ background: '#10b981', border: 'none' }}>STATE: {status?.system_state}</span>
                    </div>

                    {status ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.1)', borderRadius: '24px' }}>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Equilibrium Index</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{status.equilibrium_index}</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.1)', borderRadius: '24px' }}>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>Decay Suppression</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{status.decay_suppression_rate}</div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <button className="action-btn" onClick={handlePulse} disabled={pulsing} style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', background: '#10b981', border: 'none' }}>
                                    {pulsing ? 'Synchronizing Biosphere...' : 'Initiate Equilibrium Pulse'}
                                </button>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, mt: '0.5rem', textAlign: 'center' }}>
                                    Last synchronized pulse: {new Date(corrections[0]?.timestamp * 1000).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>Connecting to the Global clinical consciousness...</div>
                    )}
                </div>

                {/* The End of Ageing / Genomic Repair */}
                <div className="content-card">
                    <h3>⏳ The End of Ageing</h3>
                    <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                        Real-time genomic repair at the scale of species-wide cellular decay. Maintaining the "Eternal-State" across all digitized biological twins.
                    </p>

                    <div style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)', height: '10px', borderRadius: '5px', marginBottom: '1rem' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '2rem' }}>
                        <span>Cellular Decay Rate</span>
                        <span>Genomic Repair Rate</span>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Active Stabilization Flux</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Balanced (0.0000000001% Drift)</div>
                        </div>
                        <button className="action-btn secondary" onClick={handleStabilize} disabled={stabilizing}>
                            {stabilizing ? 'Stabilizing Flux...' : 'Stabilize Repair Ratio'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Absolute Sovereignty Monitor */}
            <div className="content-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>🌌 Absolute Biological Sovereignty</h3>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>[ PLANETARY SYSTEM SECURED ]</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {['Sovereign-DNA', 'Privacy-Atomic', 'Node-Equilibrium', 'Agent-Foundry'].map(system => (
                        <div key={system} style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', textAlign: 'center', border: '1px solid #10b981' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{system}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>ACTIVE-IN-PERPETUITY</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Autonomous Correction History */}
            <div className="content-card" style={{ marginTop: '2rem' }}>
                <h3>📋 Autonomous Correction Log</h3>
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                    {corrections.map(corr => (
                        <div key={corr.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                            <span><code>{corr.id}</code></span>
                            <span>{corr.type}</span>
                            <span style={{ color: '#10b981' }}>Drift Adjusted: {corr.drift_corrected}</span>
                            <span style={{ opacity: 0.5 }}>{new Date(corr.timestamp * 1000).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
