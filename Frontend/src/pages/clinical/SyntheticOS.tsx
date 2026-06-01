import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Foundry {
    id: string;
    name: string;
    active_circuits: number;
    status: string;
}

interface BioStatus {
    bios_version: string;
    foundries: Foundry[];
}

interface Circuit {
    id: string;
    target: string;
    logic: string;
    status: string;
    error_rate: string;
}

interface AuditEntry {
    id: string;
    foundry: string;
    blueprint: string;
    hash: string;
    timestamp: number;
    status: string;
}

interface DebugLog {
    timestamp: number;
    step: string;
    signal?: string;
    gate?: string;
    status?: string;
}

interface DebugTrace {
    trace_id: string;
    execution_log: DebugLog[];
    conclusion: string;
}

export default function SyntheticOS() {
    usePageTitle('Synthetic Bio-OS');
    const { showToast } = useToast();

    const [status, setStatus] = useState<BioStatus | null>(null);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [audit, setAudit] = useState<AuditEntry[]>([]);
    const [simulating, setSimulating] = useState(false);
    const [debugTrace, setDebugTrace] = useState<DebugTrace | null>(null);

    const { data: wsData, isConnected } = useWebSocket('/ws/bios');

    useEffect(() => {
        loadOSData();
    }, []);

    useEffect(() => {
        if (wsData) {
            if (wsData.status) setStatus(wsData.status);
            if (wsData.circuits) setCircuits(wsData.circuits);
            if (wsData.audit_trail) setAudit(wsData.audit_trail);
        }
    }, [wsData]);

    const loadOSData = () => {
        Promise.all([
            api.get('/bios/status'),
            api.get('/bios/circuits'),
            api.get('/bios/audit')
        ]).then(([sRes, cRes, aRes]) => {
            setStatus(sRes.data);
            setCircuits(cRes.data.circuits);
            setAudit(aRes.data.audit_trail);
        }).catch(err => console.error("Bio-OS data load failed", err));
    };

    const handleDebug = (circuitId: string) => {
        api.get(`/bios/debug/${circuitId}`)
            .then(res => setDebugTrace(res.data))
            .catch(() => showToast("Debug trace failed.", 'error'));
    };

    const handleSynthesis = () => {
        setSimulating(true);
        api.post('/bios/synthesis/start', { foundry_id: 'foundry_01_zurich', protein_blueprint: 'BluePrint-HSA-Alpha-9' })
            .then(res => {
                showToast(res.data.message, 'success');
                setSimulating(false);
            })
            .catch(() => {
                setSimulating(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🧬</span><span className="gradient-text"> Synthetic Biological OS (BIOS)</span></h1>
                <p>Direct low-level interface for bio-foundries. Debugging synthetic biological circuits and tracking molecular synthesis at the atomic level.</p>
            </div>

            <div className="grid-2">
                {/* OS Status & Foundries */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>🏭 Connected Bio-Foundries</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className={`status-badge ${isConnected ? 'active' : ''}`} style={{ fontSize: '0.65rem', background: isConnected ? '#ec4899' : 'transparent', border: isConnected ? 'none' : '1px solid var(--border-color)' }}>
                                {isConnected ? 'WS LIVE' : 'CONNECTING'}
                            </span>
                            <span className="status-badge active" style={{ background: '#ec4899', border: 'none' }}>BIOS {status?.bios_version}</span>
                        </div>
                    </div>

                    {status ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {status.foundries.map(foundry => (
                                <div key={foundry.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: 'rgba(236, 72, 153, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{foundry.name}</h4>
                                        <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 'bold' }}>{foundry.id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.8 }}>
                                        <span>Active Circuits: <strong>{foundry.active_circuits}</strong></span>
                                        <span style={{ color: '#22c55e' }}>● {foundry.status.toUpperCase()}</span>
                                    </div>
                                </div>
                            ))}
                            <button className="action-btn" onClick={handleSynthesis} disabled={simulating} style={{ marginTop: '1rem', background: '#ec4899', border: 'none' }}>
                                {simulating ? 'Transmitting Blueprints...' : 'Initiate Protein Induction'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Connecting to Bio-Gateways...</div>
                    )}
                </div>

                {/* Circuit Debugging */}
                <div className="content-card">
                    <h3>🔬 Biological Circuit Debugger</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                        Real-time logic trace of synthetic biological circuits. Monitor gate errors and protein output induction.
                    </p>

                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        {circuits.map(circ => (
                            <div key={circ.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', background: circ.status === 'debugging' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>{circ.target}</h4>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>{circ.id}</span>
                                </div>
                                <code style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                    {circ.logic}
                                </code>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem' }}>Error Rate: <strong style={{ color: parseFloat(circ.error_rate) > 0.01 ? '#ef4444' : '#22c55e' }}>{circ.error_rate}</strong></div>
                                    <button className="action-btn secondary" onClick={() => handleDebug(circ.id)} style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                                        Debug Trace
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {debugTrace && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--primary-color)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Trace: {debugTrace.trace_id}</span>
                                <button onClick={() => setDebugTrace(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ borderLeft: '2px solid var(--primary-color)', paddingLeft: '1rem' }}>
                                {debugTrace.execution_log.map((log, i) => (
                                    <div key={i} style={{ marginBottom: '0.25rem' }}>
                                        <span style={{ opacity: 0.5 }}>[{new Date(log.timestamp * 1000).toLocaleTimeString()}]</span> {log.step}: <strong>{log.signal || log.gate || log.status}</strong>
                                    </div>
                                ))}
                                <div style={{ color: '#22c55e', marginTop: '0.5rem', fontWeight: 'bold' }}>✓ {debugTrace.conclusion}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Molecular Audit Trail */}
            <div className="content-card" style={{ marginTop: '2rem' }}>
                <h3>⛓️ Molecular Synthesis Audit Trail</h3>
                <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.7 }}>
                                <th style={{ padding: '0.75rem' }}>Audit ID</th>
                                <th style={{ padding: '0.75rem' }}>Foundry</th>
                                <th style={{ padding: '0.75rem' }}>Blueprint</th>
                                <th style={{ padding: '0.75rem' }}>Molecular Hash</th>
                                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {audit.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No synthesis events on ledger.</td></tr>
                            ) : (
                                audit.map(entry => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem' }}><code>{entry.id}</code></td>
                                        <td style={{ padding: '0.75rem' }}>{entry.foundry}</td>
                                        <td style={{ padding: '0.75rem' }}>{entry.blueprint}</td>
                                        <td style={{ padding: '0.75rem' }}><code>{entry.hash.substring(0, 12)}...</code></td>
                                        <td style={{ padding: '0.75rem' }}>{new Date(entry.timestamp * 1000).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}><span className="status-badge active" style={{ background: '#9333ea', border: 'none' }}>{entry.status}</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
