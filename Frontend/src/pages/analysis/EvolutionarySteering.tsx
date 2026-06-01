import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function EvolutionarySteering() {
    usePageTitle('Evolutionary Steering');
    const { showToast } = useToast();

    const [metrics, setMetrics] = useState<any>(null);
    const [inventory, setInventory] = useState<any[]>([]);
    const [forecasting, setForecasting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [lastForecast, setLastForecast] = useState<any>(null);

    useEffect(() => {
        loadEvoData();
        const interval = setInterval(loadEvoData, 6000);
        return () => clearInterval(interval);
    }, []);

    const loadEvoData = () => {
        Promise.all([
            api.get('/evolution/metrics'),
            api.get('/evolution/inventory')
        ]).then(([mRes, iRes]) => {
            setMetrics(mRes.data);
            setInventory(iRes.data.inventory);
        }).catch(err => console.error("Evolutionary data load failed", err));
    };

    const handleForecast = (strainId) => {
        setForecasting(true);
        api.post('/evolution/forecast', { strain_id: strainId })
            .then(res => {
                setLastForecast(res.data);
                setForecasting(false);
            })
            .catch(err => {
                showToast("Forecast failed.", 'error');
                setForecasting(false);
            });
    };

    const handleGenerateVaccine = () => {
        if (!lastForecast) return;
        setGenerating(true);
        api.post('/evolution/vaccine/generate', { forecast_id: lastForecast.forecast_id })
            .then(res => {
                showToast(res.data.message, 'success');
                setGenerating(false);
                loadEvoData();
            })
            .catch(err => {
                showToast("Vaccine generation failed.", 'error');
                setGenerating(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧬</span><span className="gradient-text"> Evolutionary Genomic Steering</span></h1>
                <p>Forecasting the future of viral evolution. Pre-empting pandemics by generating vaccine blueprints for variants that do not yet exist.</p>
            </div>

            <div className="grid-2">
                {/* Viral Monitoring & Forecasting */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🦠 High-Risk Pathogen Watch</h3>
                        <span className="status-badge active" style={{ background: '#f59e0b', border: 'none' }}>FORECASTING ACTIVE</span>
                    </div>

                    {metrics ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {metrics.strains.map(strain => (
                                <div key={strain.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{strain.name}</h4>
                                        <span className={`status-badge ${strain.evolutionary_risk === 'High' ? 'critical' : 'active'}`}>
                                            RISK: {strain.evolutionary_risk}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem' }}>
                                        Forecast Horizon: <strong>{strain.forecast_horizon}</strong>
                                    </div>
                                    <button
                                        className="action-btn"
                                        onClick={() => handleForecast(strain.id)}
                                        disabled={forecasting}
                                        style={{ width: '100%', fontSize: '0.8rem' }}
                                    >
                                        {forecasting ? 'Running Markov Simulation...' : '🔭 Forecast Next Mutation'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading viral risk models...</div>
                    )}
                </div>

                {/* Pre-emptive Synthesis Console */}
                <div className="content-card">
                    <h3>🔬 Pre-emptive Synthesis</h3>

                    {lastForecast ? (
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>Latest Forecast: {lastForecast.forecast_id}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{lastForecast.predicted_variant}</div>
                            <div style={{ fontSize: '0.85rem' }}>Probability Score: <strong>{(lastForecast.probability * 100).toFixed(1)}%</strong></div>
                            <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Est. Global Emergence: <strong>{lastForecast.estimated_emergence}</strong></div>
                            <button className="action-btn" onClick={handleGenerateVaccine} disabled={generating} style={{ background: '#22c55e', border: 'none', width: '100%' }}>
                                {generating ? 'Synthesizing Blueprint...' : '🧪 Generate Pre-emptive Vaccine'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border-color)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            Run a forecast to unlock pre-emptive synthesis.
                        </div>
                    )}

                    <h4>🗄️ Global Immunity Vault (Archived)</h4>
                    <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', marginTop: '1rem' }}>
                        {inventory.length === 0 ? (
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>No pre-emptive blueprints stored.</div>
                        ) : (
                            inventory.map(vac => (
                                <div key={vac.id} style={{ fontSize: '0.8rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{vac.id}</span>
                                    <span style={{ color: '#22c55e' }}>STABLE</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Biodiversity Vault Integration */}
            <div className="content-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(59, 130, 246, 0.05))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>🧬 Biodiversity Genomic Vault Sync</h3>
                    <span style={{ fontSize: '0.85rem' }}>Status: <strong style={{ color: '#22c55e' }}>94% Synced</strong></span>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    Leveraging cross-species genomic data to identify conserved viral targets and broad-spectrum immunity pathways.
                </p>
            </div>
        </div>
    );
}
