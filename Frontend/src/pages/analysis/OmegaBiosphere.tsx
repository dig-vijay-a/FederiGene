import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function OmegaBiosphere() {
    usePageTitle('The Omega Project');
    const { showToast } = useToast();

    const [metrics, setMetrics] = useState<any>(null);
    const [repairs, setRepairs] = useState<any[]>([]);
    const [repairing, setRepairing] = useState(false);
    const [encrypting, setEncrypting] = useState(false);
    const [locus, setLocus] = useState('Locus-7-A-Beta');

    useEffect(() => {
        loadOmegaData();
        const interval = setInterval(loadOmegaData, 4000);
        return () => clearInterval(interval);
    }, []);

    const loadOmegaData = () => {
        Promise.all([
            api.get('/omega/biosphere'),
            api.get('/omega/repairs/active')
        ]).then(([mRes, rRes]) => {
            setMetrics(mRes.data);
            setRepairs(rRes.data.repairs);
        }).catch(err => console.error("Omega data load failed", err));
    };

    const handleStartRepair = () => {
        setRepairing(true);
        api.post('/omega/repair/initiate', { genomic_locus: locus })
            .then(res => {
                showToast(res.data.message, 'success');
                setRepairing(false);
                loadOmegaData();
            })
            .catch(err => {
                showToast("Repair initiation failed.", 'error');
                setRepairing(false);
            });
    };

    const handleGenerateKey = () => {
        setEncrypting(true);
        api.post('/omega/encryption/generate-key', { sample_hash: 'genomic_hash_7701' })
            .then(res => {
                showToast(`Bio-Encryption Key Generated: ${res.data.key_id}`, 'success');
                setEncrypting(false);
            })
            .catch(err => {
                showToast("Encryption failed.", 'error');
                setEncrypting(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🌌</span><span className="gradient-text"> The Omega Project: Universal Biosphere</span></h1>
                <p>Establishing a high-fidelity biological twin of the human race. Autonomous genomic repair and DNA-native privacy at the species level.</p>
            </div>

            <div className="grid-2">
                {/* Biosphere Metrics */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🌐 Universal Twin Network</h3>
                        <span className="status-badge active" style={{ background: '#06b6d4', border: 'none' }}>SYNC INTEGRITY: {metrics?.biosphere_sync_integrity}</span>
                    </div>

                    {metrics ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '2rem', borderRadius: '16px', border: '1px solid #06b6d4', textAlign: 'center', gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Digitized Biological Twins</div>
                                <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#06b6d4' }}>{(metrics.total_digitized_twins / 1000000000).toFixed(2)}B</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>Live coverage of 99.8% of the human biosphere</div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Healing Index</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{metrics.global_healing_index}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Last Synaptic Refresh</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>5s ago</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Synchronizing with species-level network...</div>
                    )}
                </div>

                {/* Autonomous Genomic Repair */}
                <div className="content-card">
                    <h3>🛠️ Autonomous Genomic Repair</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                        Real-time autonomous error correction in the collective genomic-twin database. Simulating the end of genetic disease.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        {repairs.map(repair => (
                            <div key={repair.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>{repair.target}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>{repair.status.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    Integrity Gain: <span style={{ color: '#10b981' }}>{repair.integrity_gain}</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(100, (parseFloat(repair.integrity_gain) || 0) * 10)}%`,
                                        background: '#10b981',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="form-input"
                            value={locus}
                            onChange={e => setLocus((e.target as any).value)}
                            placeholder="Target Genomic Locus..."
                            style={{ flex: 1 }}
                        />
                        <button className="action-btn" onClick={handleStartRepair} disabled={repairing}>
                            {repairing ? 'Engaging...' : 'Initiate Repair Cycle'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Universal Bio-Encryption */}
            <div className="content-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(16, 185, 129, 0.05))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>🧬 Universal Bio-Encryption (DNA-Native)</h3>
                    <button className="action-btn" onClick={handleGenerateKey} disabled={encrypting} style={{ background: '#10b981', border: 'none' }}>
                        {encrypting ? 'Deriving Key...' : 'Derive Species-Specific Key'}
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Privacy Level</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Genome-Sovereign</div>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Encryption Complexity</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>12D Tensor Mapping</div>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Audit Visibility</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Nuclear Revocability</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
