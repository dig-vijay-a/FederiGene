import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function QuantumShield() {
    usePageTitle('Quantum-Resistant Privacy');
    const { showToast } = useToast();

    const [status, setStatus] = useState<any>(null);
    const [generatingKey, setGeneratingKey] = useState(false);
    const [latestKey, setLatestKey] = useState<any>(null);

    const [simulatingLHE, setSimulatingLHE] = useState(false);
    const [lheResult, setLheResult] = useState<any>(null);

    useEffect(() => {
        loadQuantumStatus();
    }, []);

    const loadQuantumStatus = () => {
        api.get('/quantum/status')
            .then(res => setStatus(res.data))
            .catch(err => console.error("Failed to load quantum status", err));
    };

    const handleGenerateKey = () => {
        setGeneratingKey(true);
        api.post('/quantum/keys/generate')
            .then(res => {
                showToast("NIST-Compliant PQC Key Pair Generated Successfully", 'success');
                setLatestKey(res.data);
                setGeneratingKey(false);
            })
            .catch(err => {
                showToast("PQC Key Generation failed.", 'error');
                setGeneratingKey(false);
            });
    };

    const handleSimulateLHE = () => {
        setSimulatingLHE(true);
        api.post('/quantum/encrypt/lattice', { data_size_kb: 512 })
            .then(res => {
                showToast("Lattice-based Homomorphic Encryption Simulated", 'success');
                setLheResult(res.data);
                setSimulatingLHE(false);
            })
            .catch(err => {
                showToast("LHE Simulation failed.", 'error');
                setSimulatingLHE(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">⚛️</span><span className="gradient-text"> Quantum-Resistant Privacy (PQC)</span></h1>
                <p>Protecting clinical data against future quantum computer attacks (Shor's Algorithm) using NIST-standardized Post-Quantum Cryptography and Lattice-based Homomorphic Encryption.</p>
            </div>

            <div className="grid-2">
                {/* Quantum Posture */}
                <div className="content-card">
                    <h3>🛡️ Quantum Security Posture</h3>
                    {status ? (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>PQC Migration Progress</span>
                                    <strong style={{ color: 'var(--primary-color)' }}>{status.pqc_migration_progress}%</strong>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${status.pqc_migration_progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 1s ease' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{status.data_longevity_guarantee}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Data Longevity</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{status.quantum_resistant_nodes}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Hardened Nodes</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.05)' }}>
                                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Active Standard:</strong> {status.active_pqc_standard}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}><strong>Threat Model:</strong> {status.threat_model}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading posture data...</div>
                    )}
                </div>

                {/* Key Management & LHE */}
                <div className="content-card">
                    <h3>🛠️ Cryptographic Operations</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Generate PQC key pairs for secure multi-party computation and simulate Lattice-based Homomorphic Encryption overhead.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <button
                            className="action-btn"
                            onClick={handleGenerateKey}
                            disabled={generatingKey}
                            style={{ width: '100%', background: '#4f46e5' }}
                        >
                            {generatingKey ? 'Generating Kyber-512 Lattice...' : '🔑 Generate PQC Key Pair'}
                        </button>

                        {latestKey && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--primary-color)' }}>
                                <div><strong>ID:</strong> {latestKey.key_id}</div>
                                <div style={{ wordBreak: 'break-all', opacity: 0.7 }}><strong>Public Hash:</strong> {latestKey.public_key_hash}</div>
                            </div>
                        )}
                    </div>

                    <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            className="action-btn secondary"
                            onClick={handleSimulateLHE}
                            disabled={simulatingLHE}
                            style={{ width: '100%' }}
                        >
                            {simulatingLHE ? 'Computing LWE high-dimension matrices...' : '🧬 Simulate Lattice Encryption (LHE)'}
                        </button>

                        {lheResult && (
                            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    <div style={{ opacity: 0.7 }}>Noise Budget</div>
                                    <div style={{ fontWeight: 'bold' }}>{lheResult.noise_budget_remaining}%</div>
                                </div>
                                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    <div style={{ opacity: 0.7 }}>Overhead</div>
                                    <div style={{ fontWeight: 'bold' }}>{lheResult.overhead_multiplier}x</div>
                                </div>
                                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    <div style={{ opacity: 0.7 }}>Processing Time</div>
                                    <div style={{ fontWeight: 'bold' }}>{lheResult.processing_time_ms}ms</div>
                                </div>
                                <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    <div style={{ opacity: 0.7 }}>Quantum Security</div>
                                    <div style={{ fontWeight: 'bold', color: '#22c55e' }}>{lheResult.security_level}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
