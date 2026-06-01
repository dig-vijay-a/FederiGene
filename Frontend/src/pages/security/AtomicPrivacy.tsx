import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function AtomicPrivacy() {
    usePageTitle('Atomic Privacy');
    const { showToast } = useToast();

    const [metrics, setMetrics] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [simulating, setSimulating] = useState(false);
    const [dnaResult, setDnaResult] = useState<any>(null);
    const [taskInput, setTaskInput] = useState('Compute Peptide-Lattice Entropy');

    useEffect(() => {
        loadAtomicData();
        const interval = setInterval(loadAtomicData, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadAtomicData = () => {
        Promise.all([
            api.get('/atomic/metrics'),
            api.get('/atomic/compute/active')
        ]).then(([mRes, tRes]) => {
            setMetrics(mRes.data);
            setTasks(tRes.data.tasks);
        }).catch(err => console.error("Atomic privacy data load failed", err));
    };

    const handleDnaEncrypt = () => {
        api.post('/atomic/encrypt/dna', { packet_id: 'PACK-001', sample_hash: 'dna_v_alpha_9' })
            .then(res => {
                showToast("Encryption Key Successfully Embedded in Synthetic DNA Helix", 'success');
                setDnaResult(res.data);
            })
            .catch(err => showToast("DNA Encryption failed.", 'error'));
    };

    const handleStartTask = () => {
        setSimulating(true);
        api.post('/atomic/compute/molecular', { task: taskInput })
            .then(res => {
                showToast(res.data.message, 'success');
                setSimulating(false);
                loadAtomicData();
            })
            .catch(err => {
                showToast("Molecular compute failed.", 'error');
                setSimulating(false);
            });
    };

    const handleDeploySelfDestruct = () => {
        api.post('/atomic/deploy/self-destruct', { data_id: 'SENSITIVE-GENOME-X', trigger_id: 'trig_ph' })
            .then(res => showToast(`Armed & Deployed: ${res.data.deployment_id}`, 'success'))
            .catch(err => showToast("Deployment failed.", 'error'));
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">⚛️</span><span className="gradient-text"> Atomic-Level Privacy Sovereignty</span></h1>
                <p>Pushing security beyond bits and bytes. Privacy computation at the molecular shell and encryption stored within synthetic DNA lattices.</p>
            </div>

            <div className="grid-2">
                {/* DNA-Native Encryption */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🧬 DNA-Native Vaults</h3>
                        <span className="status-badge active" style={{ background: '#7c3aed', border: 'none' }}>DNA-COHERENT</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(124, 58, 237, 0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid #7c3aed', textAlign: 'center', gridColumn: 'span 2' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>Total DNA-Storage Capacity</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>1,700 PB</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Molecular Redundancy: 128x</div>
                        </div>

                        <button className="action-btn" onClick={handleDnaEncrypt} style={{ gridColumn: 'span 2', background: '#7c3aed', border: 'none' }}>
                            Embed Encryption into DNA Lattice
                        </button>
                    </div>

                    {dnaResult && (
                        <div style={{ border: '1px solid #7c3aed', background: 'rgba(124, 58, 237, 0.05)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Lattice-Key Generated: {dnaResult.encryption_id}</div>
                            <div style={{ opacity: 0.8 }}>Coordinates: <code>{dnaResult.dna_lattice_coordinates}</code></div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#7c3aed' }}>✓ Key Successfully Embedded in Synthetic Helix</div>
                        </div>
                    )}
                </div>

                {/* Molecular Computation */}
                <div className="content-card">
                    <h3>🔬 Molecular-Shell Computation</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.25rem' }}>
                        Privacy-preserving logic executed via peptide-folding interactions. The computation itself leaves no digital footprint.
                    </p>

                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{task.task}</h4>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: task.status === 'completed' ? '#22c55e' : 'var(--primary-color)' }}>{task.status.toUpperCase()}</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${task.progress * 100}%`, background: '#22c55e', transition: 'width 0.5s ease' }} />
                                </div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem' }}>Isolation: {task.isolation_level}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input className="form-input" value={taskInput} onChange={e => setTaskInput((e.target as any).value)} style={{ flex: 1 }} />
                        <button className="action-btn" onClick={handleStartTask} disabled={simulating}>
                            {simulating ? 'Inducing...' : 'Start Interaction'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Self-Destructing Biological Data */}
            <div className="content-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(124, 58, 237, 0.05))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>☣️ Biological-Trigger Self-Destruction</h3>
                    <button className="action-btn" onClick={handleDeploySelfDestruct} style={{ background: '#ef4444', border: 'none' }}>
                        Deploy Environmentally-Arrested Packet
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    <div style={{ border: '1px solid #ef4444', borderRadius: '12px', padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>pH-Sensitivity Trigger</h4>
                        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Data packet degrades and erases all molecular traces if ambient pH drops below 4.5.</p>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>STATE: ARMED</div>
                    </div>
                    <div style={{ border: '1px solid #f59e0b', borderRadius: '12px', padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>Thermal Thermal Degradation</h4>
                        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Automatic peptide unraveling if local tissue temperature exceeds 39.5°C.</p>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>STATE: ARMED</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
