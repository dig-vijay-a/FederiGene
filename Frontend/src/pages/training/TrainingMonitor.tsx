import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function TrainingMonitor() {
    const { id } = useParams();
    usePageTitle(`Monitor | Job #${id}`);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [starting, setStarting] = useState(false);

    // WebSocket state
    const wsRef = useRef<any>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [liveRounds, setLiveRounds] = useState<any[]>([]);   // pushed from WS
    const [liveLog, setLiveLog] = useState<any[]>([]);         // human-readable event log
    const logEndRef = useRef<any>(null);

    // ── Initial REST fetch ─────────────────────────────────────────────
    const fetchJob = useCallback(() => {
        api.get(`/platform/training/${id}`)
            .then(res => {
                setJob(res.data);
                // Seed chart with historical model versions
                if (res.data.model_versions?.length > 0) {
                    setLiveRounds(prev => {
                        if (prev.length >= res.data.model_versions.length) return prev;
                        return [...res.data.model_versions].reverse().map(m => ({
                            round: `R${m.round_number}`,
                            Accuracy: +(m.accuracy * 100).toFixed(2),
                            Loss: +m.loss.toFixed(4),
                            AUC: +(m.auc * 100).toFixed(2),
                        }));
                    });
                }

                // Seed logs with historical states
                setLiveLog(prev => {
                    const newLogs = [];
                    
                    if (res.data.status !== 'pending' && !prev.some(l => l.text.includes('started —'))) {
                        newLogs.push({
                            time: new Date(res.data.started_at || res.data.created_at || Date.now()).toLocaleTimeString(),
                            text: `Job "${res.data.name}" started — ${res.data.total_rounds} rounds scheduled`,
                            color: '#3b82f6'
                        });
                    }

                    if (res.data.model_versions?.length > 0) {
                        const existingRounds = new Set(prev.filter(l => l.text.includes('Round')).map(l => l.text.match(/Round (\d+)/)?.[1]));
                        const missingRounds = [...res.data.model_versions].reverse().filter(m => !existingRounds.has(String(m.round_number)));
                        
                        const roundLogs = missingRounds.map(m => ({
                            time: new Date(m.created_at || Date.now()).toLocaleTimeString(),
                            text: `Round ${m.round_number}/${res.data.total_rounds} — Acc: ${(m.accuracy * 100).toFixed(1)}%  Loss: ${m.loss.toFixed(4)}  AUC: ${(m.auc * 100).toFixed(1)}%`,
                            color: '#8b5cf6'
                        }));
                        newLogs.push(...roundLogs);
                    }

                    if ((res.data.status === 'completed' || res.data.status === 'failed') && !prev.some(l => l.text.includes('Job finished'))) {
                        newLogs.push({
                            time: new Date(res.data.completed_at || Date.now()).toLocaleTimeString(),
                            text: `🏁 Job finished — Final status: ${res.data.status}`,
                            color: res.data.status === 'completed' ? '#22c55e' : '#ef4444'
                        });
                    }

                    return [...prev, ...newLogs];
                });
            })
            .catch(() => setError('Failed to load training job'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { 
        fetchJob(); 
        const interval = setInterval(fetchJob, 5000);
        return () => clearInterval(interval);
    }, [fetchJob]);

    // ── WebSocket connection (while job is running) ─────────────────────
    useEffect(() => {
        if (!job) return;
        if (job.status !== 'running' && job.status !== 'pending') return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsBase = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}`;
        const wsUrl = `${wsBase}/ws/training/${id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
            setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: 'Connected to live training feed 🔴', color: '#22c55e' }]);
        };

        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);

                if (msg.event === 'round_completed') {
                    // Append live round data to the chart
                    setLiveRounds(prev => [
                        ...prev,
                        {
                            round: `R${msg.round}`,
                            Accuracy: +(msg.accuracy * 100).toFixed(2),
                            Loss: +msg.loss.toFixed(4),
                            AUC: +(msg.auc * 100).toFixed(2),
                        }
                    ]);
                    setLiveLog(prev => [
                        ...prev,
                        {
                            time: new Date().toLocaleTimeString(),
                            text: `Round ${msg.round}/${msg.total_rounds} — Acc: ${(msg.accuracy * 100).toFixed(1)}%  Loss: ${msg.loss.toFixed(4)}  AUC: ${(msg.auc * 100).toFixed(1)}%  [${msg.aggregation}]`,
                            color: '#8b5cf6'
                        }
                    ]);
                    // Refresh full job stats after every round
                    fetchJob();
                }

                if (msg.event === 'job_started') {
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Job "${msg.name}" started — ${msg.total_rounds} rounds scheduled`, color: '#3b82f6' }]);
                }

                if (msg.event === 'round_started') {
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `→ Round ${msg.round} initializing…`, color: '#f59e0b' }]);
                }
                
                if (msg.event === 'node_submitted') {
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `📥 Node [Org ${msg.org_id}] submitted weights for Round ${msg.round} (Loss: ${msg.loss?.toFixed(4) || 'N/A'})`, color: '#a855f7' }]);
                }

                if (msg.event === 'job_finished') {
                    setWsConnected(false);
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `🏁 Job finished — Final status: ${msg.status}`, color: '#22c55e' }]);
                    fetchJob();
                    ws.close();
                }

                if (msg.event === 'job_error') {
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `❌ Error: ${msg.message}`, color: '#ef4444' }]);
                }

                if (msg.event === 'eval_started') {
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `🔍 Benchmarking Initiated: ${msg.model_version}`, color: '#3b82f6' }]);
                }

                if (msg.event === 'eval_completed') {
                    setLiveLog(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `✅ Benchmark Finished — Mean Acc: ${(msg.accuracy * 100).toFixed(2)}% across ${msg.nodes} nodes`, color: '#22c55e' }]);
                }
            } catch { }
        };

        ws.onclose = () => {
            setWsConnected(false);
        };

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 20000);

        return () => {
            clearInterval(heartbeat);
            ws.close();
        };
    }, [id, job?.status]);

    // Auto-scroll log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [liveLog]);

    const handleStart = async () => {
        setStarting(true);
        try {
            await api.post(`/platform/training/${id}/start`);
            fetchJob();
        } catch (err) {
            showToast(err.response?.data?.detail || 'Failed to start job', 'error');
        } finally {
            setStarting(false);
        }
    };

    if (loading) return <div className="empty-state"><p>Loading training data…</p></div>;
    if (error || !job) return <div className="empty-state"><p>{error}</p></div>;

    const isRunning = job.status === 'running';
    const isCompleted = job.status === 'completed';
    const progressPercent = Math.round((job.current_round / job.total_rounds) * 100);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button onClick={() => navigate('/training')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, marginBottom: '0.5rem', fontWeight: 600 }}>← Back to Jobs</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h1><span className="gradient-text">{job.name}</span></h1>
                        <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 700, fontSize: '0.9rem', padding: '4px 10px' }}>Job #{id}</span>
                    </div>
                    <p>{job.model_architecture.toUpperCase()} • {job.target_metric} optimization • ε={job.privacy_budget}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {wsConnected && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
                            LIVE
                        </span>
                    )}
                    <span className={`badge badge-${job.status}`} style={{ fontSize: '0.9rem', padding: '8px 16px' }}>{job.status.toUpperCase()}</span>
                    {job.status === 'pending' && (
                        <button className="action-btn" onClick={handleStart} disabled={starting} style={{ fontSize: '0.9rem', padding: '10px 24px', background: '#22c55e' }}>
                            {starting ? 'Starting...' : '▶ Start Training'}
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Progress</div>
                    <div className="stat-value">{Math.min(job.current_round, job.total_rounds)} <span style={{ fontSize: '1rem', opacity: 0.5 }}>/ {job.total_rounds}</span></div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: 6, borderRadius: 3, marginTop: 8 }}>
                        <div style={{ width: `${Math.min(progressPercent, 100)}%`, background: 'var(--accent-color)', height: '100%', borderRadius: 3, transition: 'width 1s ease' }}></div>
                    </div>
                </div>
                {liveRounds.length > 0 && (() => {
                    const latest = liveRounds[liveRounds.length - 1];
                    return (
                        <>
                            <div className="stat-card"><div className="stat-label">Global Accuracy</div><div className="stat-value" style={{ color: '#22c55e' }}>{latest.Accuracy}%</div></div>
                            <div className="stat-card"><div className="stat-label">Global Loss</div><div className="stat-value" style={{ color: '#ef4444' }}>{latest.Loss}</div></div>
                            <div className="stat-card"><div className="stat-label">AUC-ROC</div><div className="stat-value" style={{ color: '#3b82f6' }}>{latest.AUC}%</div></div>
                        </>
                    );
                })()}
            </div>

            <div className="form-row">
                <div className="content-card" style={{ flex: 2 }}>
                    <h3>📈 Performance vs. Rounds {wsConnected && <span style={{ color: '#ef4444', fontSize: '0.7rem', marginLeft: 8 }}>● LIVE</span>}</h3>
                    {liveRounds.length > 0 ? (
                        <div style={{ height: 300, marginTop: '1rem' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveRounds} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="round" stroke="var(--text-color)" />
                                    <YAxis yAxisId="left" stroke="#22c55e" domain={[0, 100]} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8 }} />
                                    <Legend />
                                    <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="Accuracy" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="Loss" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="AUC" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}><p>Chart will appear when training begins.</p></div>
                    )}
                </div>

                <div className="content-card" style={{ flex: 1, maxHeight: 400, overflowY: 'auto' }}>
                    <h3 style={{ position: 'sticky', top: -24, background: 'var(--card-bg)', padding: '10px 0', zIndex: 10 }}>🔒 Live Security Log</h3>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        {liveLog.length === 0 && !isCompleted && (
                            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>Waiting for job to start…</div>
                        )}
                        {liveLog.length === 0 && isCompleted && (
                            <div style={{ opacity: 0.5, fontStyle: 'italic', color: '#22c55e' }}>Job is completed. Live feed disconnected.</div>
                        )}
                        {liveLog.map((entry, i) => (
                            <div key={i} style={{ marginBottom: 6, color: entry.color || 'var(--text-color)' }}>
                                <span style={{ opacity: 0.5 }}>[{entry.time}]</span> {entry.text}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>

            <div className="content-card" style={{ marginTop: '1rem', background: 'rgba(59,130,246,0.04)', border: '1px dashed rgba(59,130,246,0.5)' }}>
                <h3 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🔌 Connect Local Node SDK
                </h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    To participate in this training job from an external lab, use the <b>FederiGene Node SDK</b>.
                </p>
                <div style={{ background: '#0f172a', padding: '12px', borderRadius: 8, marginTop: 10, fontSize: '0.8rem', fontFamily: 'monospace', color: '#94a3b8', border: '1px solid #1e293b' }}>
                    <div style={{ color: '#22c55e' }}># 1. Install SDK</div>
                    <div style={{ marginBottom: 6 }}>pip install federigene-sdk</div>
                    <div style={{ color: '#22c55e' }}># 2. Connect with your API Key</div>
                    <div>python -m federigene_sdk.connect --job={id} --key=YOUR_ORG_KEY</div>
                </div>
            </div>

            {isCompleted && job.model_versions?.length > 0 && (
                <div className="content-card" style={{ marginTop: '1rem', background: 'rgba(34,197,94,0.06)', border: '1px solid #22c55e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ color: '#22c55e', margin: 0 }}>✅ Training Complete</h3>
                            <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
                                Final model achieved {(job.model_versions[0].accuracy * 100).toFixed(2)}% accuracy across {job.participants.length} participating nodes.
                            </p>
                        </div>
                        <button
                            className="action-btn"
                            style={{ background: '#8b5cf6' }}
                            onClick={() => navigate(`/models/${job.model_versions[0].id}/explain`)}
                        >
                            🧬 View SHAP Explainability
                        </button>
                        <button
                            className="action-btn"
                            style={{ background: '#3b82f6', marginLeft: '10px' }}
                            onClick={() => navigate(`/security/compliance/${id}`)}
                        >
                            📜 Compliance Certificate
                        </button>
                    </div>
                </div>
            )}

            <div className="content-card" style={{ marginTop: '1rem' }}>
                <h3>🏥 Participating Nodes</h3>
                {job.participants.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Hospital / Lab</th><th>Dataset ID</th><th>Aggregation</th><th>Local Loss</th></tr></thead>
                        <tbody>
                            {job.participants.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>Org #{p.org_id}</td>
                                    <td>Dataset #{p.dataset_id}</td>
                                    <td><span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Krum</span></td>
                                    <td>{p.local_loss ? p.local_loss.toFixed(4) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state" style={{ padding: '1rem' }}><p>No hospitals participating yet.</p></div>
                )}
            </div>
        </div>
    );
}
