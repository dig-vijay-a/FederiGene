import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';
import ModelNetworkViewer from '../../components/ModelNetworkViewer';

export default function ModelExplainability() {
    const { id } = useParams();
    const navigate = useNavigate();
    usePageTitle('Explainability');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [topN, setTopN] = useState(10);
    const [evals, setEvals] = useState<any[]>([]);
    const [evalLoading, setEvalLoading] = useState(false);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get(`/platform/models/${id}/shap?top_n=${topN}`),
            api.get(`/platform/models/${id}/evaluations`)
        ]).then(([shapRes, evalRes]) => {
            setData(shapRes.data);
            setEvals(evalRes.data);
        }).catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [id, topN]);

    const handleRunEval = async () => {
        setEvalLoading(true);
        try {
            await api.post(`/platform/models/${id}/evaluate`);
            // Poll for results or wait a few seconds
            setTimeout(fetchData, 5000);
        } catch { } finally { setEvalLoading(false); }
    };

    const chartData = data?.shap_values?.map(sv => ({
        name: sv.feature.length > 28 ? sv.feature.slice(0, 28) + '…' : sv.feature,
        fullName: sv.feature,
        value: sv.mean_abs,
        direction: sv.direction
    })) || [];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload?.length) {
            const d = payload[0].payload;
            return (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.fullName}</p>
                    <p>SHAP Impact: <b>{d.value.toFixed(4)}</b></p>
                    <p style={{ color: d.direction === 'positive' ? '#22c55e' : '#ef4444' }}>
                        Direction: {d.direction === 'positive' ? '▲ Risk Increasing' : '▼ Risk Decreasing'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div className="page-header">
                <button onClick={() => navigate('/models')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: 0, marginBottom: '0.5rem', fontWeight: 600 }}>← Back to Model Registry</button>
                <h1><span className="emoji">🧬</span><span className="gradient-text"> Model Explainability (SHAP)</span></h1>
                <p>Feature importance analysis explaining which genomic variants most influence the model's predictions.</p>
            </div>

            {data && (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
                    <div className="stat-card"><div className="stat-icon">🏷️</div><div className="stat-value">{data.model_version}</div><div className="stat-label">Version</div></div>
                    <div className="stat-card"><div className="stat-icon">🎯</div><div className="stat-value">{(data.accuracy * 100).toFixed(1)}%</div><div className="stat-label">Accuracy</div></div>
                    <div className="stat-card"><div className="stat-icon">📈</div><div className="stat-value">{(data.auc * 100).toFixed(1)}%</div><div className="stat-label">AUC-ROC</div></div>
                    <div className="stat-card"><div className="stat-icon">🔬</div><div className="stat-value">{data.total_features_analyzed}</div><div className="stat-label">Features Analyzed</div></div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="content-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Top Feature Impact (Mean |SHAP|)</h3>
                            <p style={{ opacity: 0.6, fontSize: '0.8rem', margin: '4px 0 0' }}>
                                Genomic variants sorted by their absolute influence on model output.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ fontSize: '0.85rem', opacity: 0.8 }}>Show top</label>
                            <select className="form-input" value={topN} onChange={e => setTopN(parseInt((e.target as any).value))} style={{ width: 80, padding: '4px 8px' }}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>

                    {loading && <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>Analyzing feature importance…</div>}

                    {!loading && chartData.length > 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={380}>
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                                    <XAxis type="number" domain={[0, 1]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip active={false} payload={[]} />} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.direction === 'positive' ? '#22c55e' : '#ef4444'}
                                                fillOpacity={0.85}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <ModelNetworkViewer />
            </div>

            <div className="content-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>📊 Federated Evaluation Benchmarks</h3>
                        <p style={{ opacity: 0.6, fontSize: '0.8rem', margin: '4px 0 0' }}>
                            Model performance validated on independent, held-out datasets across hospital nodes.
                        </p>
                    </div>
                    <button className="action-btn" onClick={handleRunEval} disabled={evalLoading} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                        {evalLoading ? 'Evaluating…' : '🚀 Run Federated Eval'}
                    </button>
                </div>

                {evals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px dashed var(--card-border)' }}>
                        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No federated evaluations recorded yet for this model version.</p>
                    </div>
                ) : (
                    <div className="eval-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {evals.map((ev, i) => (
                            <div key={i} className="content-card" style={{ margin: 0, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Eval #{ev.id}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(ev.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>{(ev.eval_accuracy * 100).toFixed(1)}%</div><div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Accuracy</div></div>
                                    <div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>{ev.eval_auc.toFixed(3)}</div><div style={{ fontSize: '0.7rem', opacity: 0.6 }}>AUC-ROC</div></div>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{ev.participating_nodes}</div><div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Nodes</div></div>
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>
                                    Method: {ev.eval_type.replace(/_/g, ' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="content-card" style={{ marginTop: '1.5rem' }}>
                <h3>Raw Feature Importance Table</h3>
                <table className="data-table">
                    <thead><tr><th>Rank</th><th>Genomic Feature / Variant</th><th>Mean |SHAP|</th><th>Direction</th></tr></thead>
                    <tbody>
                        {loading && <tr><td colSpan={4} style={{ textAlign: 'center' }}>Loading…</td></tr>}
                        {!loading && data?.shap_values?.map((sv, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 600, opacity: 0.7 }}>#{i + 1}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{sv.feature}</td>
                                <td>{sv.mean_abs.toFixed(4)}</td>
                                <td>
                                    <span className="badge" style={{
                                        background: sv.direction === 'positive' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: sv.direction === 'positive' ? '#22c55e' : '#ef4444'
                                    }}>
                                        {sv.direction === 'positive' ? '▲ Risk+' : '▼ Risk−'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.5 }}>
                    Features shown are dynamically sourced from the dataset schemas utilized in the model's training job.
                </p>
            </div>
        </div >
    );
}
