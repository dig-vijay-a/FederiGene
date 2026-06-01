import { useState, useEffect } from 'react';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Telemetry {
    connected_devices: number;
    avg_heart_rate_variability: number;
}

interface Exposome {
    target_condition: string;
    top_factor: string;
    genomic_nexus: string;
    correlation_score: string;
    significance_p_value: string;
}

interface Alert {
    id: string;
    pathogen: string;
    risk_level: string;
    region: string;
    nodes_participating: number;
}

export default function PopulationHealth() {
    usePageTitle('Precision Population Health');

    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [exposome, setExposome] = useState<Exposome | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const { data: wsData, isConnected } = useWebSocket('/ws/population');

    useEffect(() => {
        loadPopulationData();
    }, []);

    useEffect(() => {
        if (wsData) {
            if (wsData.telemetry) setTelemetry(wsData.telemetry);
            if (wsData.exposome) setExposome(wsData.exposome);
            if (wsData.alerts) setAlerts(wsData.alerts);
        }
    }, [wsData]);

    const loadPopulationData = () => {
        Promise.all([
            api.get('/population/telemetry'),
            api.get('/population/exposome'),
            api.get('/population/outbreaks')
        ]).then(([telRes, expRes, outRes]) => {
            setTelemetry(telRes.data);
            setExposome(expRes.data);
            setAlerts(outRes.data.alerts);
        }).catch(err => {
            console.error("Population data load failed", err);
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">📈</span><span className="gradient-text"> Precision Population Health</span></h1>
                <p>Global real-time Bio-synchronization and Environmental Exposome monitoring via federated edge telemetry.</p>
            </div>

            <div className="grid-2">
                {/* Real-time Bio-Sync Telemetry */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>⌚ Live Wearable Telemetry</h3>
                        <span className={`status-badge ${isConnected ? 'active' : ''}`} style={{ fontSize: '0.75rem' }}>
                            {isConnected ? 'LIVE SYNC' : 'CONNECTING...'}
                        </span>
                    </div>

                    {telemetry ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Active Streams</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{telemetry.connected_devices.toLocaleString()}</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Avg HRV (Global)</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{telemetry.avg_heart_rate_variability}ms</div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem', borderRadius: '8px', gridColumn: 'span 2', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Regional Anomalies detected (last 1h)</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} style={{ width: '40px', height: '40px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
                                            ⚠️
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Connecting to wearable edge...</div>
                    )}
                </div>

                {/* Exposome Correlation */}
                <div className="content-card">
                    <h3>🌍 Federated Exposome Analysis</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        Identifying complex interactions between regional environmental factors and genomic susceptibility.
                    </p>

                    {exposome ? (
                        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Discovery Target:</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4f46e5' }}>{exposome.target_condition}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Primary Factor</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{exposome.top_factor}</div>
                                </div>
                                <div style={{ flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Genomic Nexus</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{exposome.genomic_nexus}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span>Nexus Correlation: <strong>{exposome.correlation_score}</strong></span>
                                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>P-VALUE: {exposome.significance_p_value}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Computing cross-dataset correlations...</div>
                    )}
                </div>

                {/* Outbreak Early Warning System */}
                <div className="content-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🚨 Federated Early Warning System (FEWS)</h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#ef4444' }}>🔴 HIGH RISK: 0</span>
                            <span style={{ color: '#f59e0b' }}>🟠 MODERATE: 1</span>
                            <span style={{ color: '#22c55e' }}>🟢 STABLE: 42 Regions</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {alerts.map(alert => (
                            <div key={alert.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: alert.risk_level === 'Moderate' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{alert.pathogen}</h4>
                                    <span className={`status-badge ${alert.risk_level === 'High' ? 'critical' : 'active'}`} style={{ background: alert.risk_level === 'Moderate' ? '#f59e0b' : '' }}>
                                        {alert.risk_level.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem' }}>Region: <strong>{alert.region}</strong></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                    <span>Active Monitoring: <strong>{alert.nodes_participating} nodes</strong></span>
                                    <button className="action-btn" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Investigate Clusters</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
