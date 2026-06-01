import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function BiogeneticSynthesis() {
    usePageTitle('Biogenetic Synthesis');
    const { showToast } = useToast();

    const [overview, setOverview] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [simulating, setSimulating] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [target, setTarget] = useState('Pediatric Glioma');

    useEffect(() => {
        loadSynthesisData();
        const interval = setInterval(loadSynthesisData, 5000); // Fast refresh for simulation
        return () => clearInterval(interval);
    }, []);

    const loadSynthesisData = () => {
        Promise.all([
            api.get('/synthesis/overview'),
            api.get('/synthesis/tasks')
        ]).then(([ovRes, taskRes]) => {
            setOverview(ovRes.data);
            setTasks(taskRes.data.tasks);
        }).catch(err => console.error("Synthesis data load failed", err));
    };

    const handleStartSimulation = () => {
        setSimulating(true);
        api.post('/synthesis/simulation/start', { disease_target: target })
            .then(res => {
                showToast(res.data.message, 'success');
                setSimulating(false);
                loadSynthesisData();
            })
            .catch(err => {
                showToast("Simulation failed.", 'error');
                setSimulating(false);
            });
    };

    const handleGenerateTwin = () => {
        setGenerating(true);
        api.post('/synthesis/twin/generate', { patient_ref: 'pt_8402_ped' })
            .then(res => {
                showToast(`Digital Twin Generated: ${res.data.twin_id} (Fidelity: ${res.data.fidelity_score})`, 'success');
                setGenerating(false);
                loadSynthesisData();
            })
            .catch(err => {
                showToast("Generation failed.", 'error');
                setGenerating(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧬</span><span className="gradient-text"> Biogenetic Synthesis & Simulation</span></h1>
                <p>Advanced in-silico modeling and pediatric digital twins. Move from static predictions to dynamic, federated therapeutic simulations.</p>
            </div>

            <div className="grid-2">
                {/* Simulation Overview */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🌐 Synthesis Network State</h3>
                        <span className="status-badge active" style={{ fontSize: '0.75rem' }}>COMPUTE ACTIVE</span>
                    </div>

                    {overview ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase' }}>Active Simulations</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{overview.active_simulations_count}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase' }}>Compute Utilization</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.global_compute_utilization}</div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', gridColumn: 'span 2', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Global Pediatric Digital Twins</div>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '2px', color: '#ec4899' }}>{overview.total_digital_twins_generated}</div>
                                <button
                                    className="action-btn"
                                    onClick={handleGenerateTwin}
                                    disabled={generating}
                                    style={{ marginTop: '1rem', background: '#ec4899', border: 'none' }}
                                >
                                    {generating ? 'Mapping Genomic Archetypes...' : '➕ Generate Rare Disease Twin'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading network metrics...</div>
                    )}
                </div>

                {/* Simulation Controls & Active Tasks */}
                <div className="content-card">
                    <h3>🔬 Simulation Control Center</h3>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                            className="form-input"
                            value={target}
                            onChange={e => setTarget((e.target as any).value)}
                            placeholder="Target Disease/Pathogen..."
                            style={{ flex: 1 }}
                        />
                        <button className="action-btn" onClick={handleStartSimulation} disabled={simulating}>
                            {simulating ? 'Initiating...' : 'Start In-Silico Run'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{task.target}</h4>
                                    <span className={`status-badge ${task.status === 'completed' ? 'active' : ''}`} style={{ fontSize: '0.7rem' }}>
                                        {task.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Type: {task.type}</div>

                                <div style={{ height: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${task.progress}%`,
                                        background: task.progress === 100 ? '#22c55e' : 'var(--primary-color)',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '0.25rem', opacity: 0.8 }}>{task.progress}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Advanced Synthesis Features */}
            <div className="content-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>🧫 Molecular Docking (Federated)</h3>
                    <button className="action-btn secondary" style={{ fontSize: '0.75rem' }}>View Library</button>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ minWidth: '250px', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Candidate BZ-{i * 100 + 42}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>Lipid-Nanoparticle #33</div>
                            <div style={{ fontSize: '0.85rem' }}>Predicted Efficacy: <strong style={{ color: '#22c55e' }}>{85 + i * 2}%</strong></div>
                            <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Docking Score: <strong>-9.2 kcal/mol</strong></div>
                            <button className="action-btn" style={{ fontSize: '0.7rem', padding: '4px 10px', width: '100%' }}>Simulate Toxicity</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
