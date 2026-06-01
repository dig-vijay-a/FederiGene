import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FederatedQuery() {
    usePageTitle('Federated Analytics');
    const { showToast } = useToast();
    const [queryCondition, setQueryCondition] = useState('mutation = "BRCA1"');
    const fullQuery = `SELECT COUNT(*) FROM patient_genomics WHERE ${queryCondition}`;
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Sample stats for the visualization
    const [chartData, setChartData] = useState([
        { name: 'Hospital A', count: 124, color: '#3b82f6' },
        { name: 'Hospital B', count: 89, color: '#8b5cf6' },
        { name: 'Hospital C', count: 212, color: '#ec4899' },
        { name: 'Global (Agg)', count: 425, color: '#22c55e' }
    ]);

    useEffect(() => {
        if (!result) return;
        const interval = setInterval(() => {
            api.post('/platform/analytics/query', { query_text: fullQuery })
                .then(res => {
                    const data = res.data;
                    setResult(data);
                    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                    const dynamicChartData = data.node_breakdown.map((node: any, i: number) => ({
                        name: node.name,
                        count: node.count,
                        color: colors[i % colors.length]
                    }));
                    dynamicChartData.push({
                        name: 'Global (Agg)',
                        count: data.global_count,
                        color: '#22c55e'
                    });
                    setChartData(dynamicChartData);
                }).catch(() => {});
        }, 10000);
        return () => clearInterval(interval);
    }, [result, fullQuery]);

    const handleRunQuery = () => {
        setLoading(true);
        // Call the live federated analytics endpoint
        api.post('/platform/analytics/query', { query_text: fullQuery })
            .then(res => {
                const data = res.data;
                setResult(data);
                
                // Construct chart data dynamically from the real node breakdown
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                const dynamicChartData = data.node_breakdown.map((node, i) => ({
                    name: node.name,
                    count: node.count,
                    color: colors[i % colors.length]
                }));
                
                // Add the global aggregation to the chart
                dynamicChartData.push({
                    name: 'Global (Agg)',
                    count: data.global_count,
                    color: '#22c55e'
                });
                
                setChartData(dynamicChartData);
            })
            .catch(err => {
                console.error("Query failed", err);
                showToast("Failed to execute federated query.", 'error');
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="analytics-container">
            <div className="page-header">
                <h1><span className="gradient-text">Federated Analytics </span><span className="emoji">🧪</span></h1>
                <p>Execute privacy-preserving SQL queries across the research network.</p>
            </div>

            <div className="query-layout">
                <div className="editor-section">
                    <div className="content-card">
                        <h3>Query Editor</h3>
                        <div className="sql-editor" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', boxSizing: 'border-box' }}>
                            <span style={{ opacity: 0.7, whiteSpace: 'nowrap' }}>SELECT COUNT(*) FROM patient_genomics WHERE</span>
                            <input
                                type="text"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px dashed #38bdf8',
                                    color: '#38bdf8',
                                    fontFamily: "'Fira Code', monospace",
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    flex: 1,
                                    minWidth: '200px',
                                    padding: '0 4px'
                                }}
                                value={queryCondition}
                                onChange={(e) => setQueryCondition(e.target.value)}
                            />
                        </div>
                        <div className="editor-actions">
                            <button className="secondary-btn">Save Views</button>
                            <button
                                className="primary-btn"
                                onClick={handleRunQuery}
                                disabled={loading}
                            >
                                {loading ? 'Executing...' : 'Run Distributed Query ⚡'}
                            </button>
                        </div>
                    </div>

                    {result && (
                        <div className="content-card result-card">
                            <div className="result-header">
                                <div className="stat">
                                    <span className="label">Global Result</span>
                                    <span className="value">{result.global_count} Patients</span>
                                </div>
                                <div className="privacy-badges">
                                    <span className="badge badge-success">HE Secure</span>
                                    <span className="badge badge-primary">DP Protected</span>
                                </div>
                            </div>

                            <div className="chart-container" style={{ height: 300, marginTop: '20px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                        <YAxis stroke="rgba(255,255,255,0.5)" />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                <aside className="analytics-sidebar">
                    <div className="content-card privacy-summary">
                        <h3>Privacy Engine</h3>
                        <div className="privacy-item">
                            <div className="icon">🔒</div>
                            <div className="text">
                                <strong>Homomorphic Encryption</strong>
                                <p>Aggregating local sums without decryption.</p>
                            </div>
                        </div>
                        <div className="privacy-item">
                            <div className="icon">🌊</div>
                            <div className="text">
                                <strong>Differential Privacy</strong>
                                <p>Gaussian noise added to prevent membership inference.</p>
                            </div>
                        </div>
                        <div className="privacy-item">
                            <div className="icon">📜</div>
                            <div className="text">
                                <strong>FHIR Normalization</strong>
                                <p>Automatic mapping to clinical standards.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <style>{`
                .query-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; margin-top: 20px; }
                .sql-editor { width: 100%; min-height: 80px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #38bdf8; font-family: 'Fira Code', monospace; padding: 15px; margin-top: 10px; font-size: 0.9rem; }
                .editor-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; }
                
                .result-card { border-top: 4px solid #22c55e; }
                .result-header { display: flex; justify-content: space-between; align-items: center; }
                .stat { display: flex; flex-direction: column; }
                .stat .label { font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; }
                .stat .value { font-size: 2rem; font-weight: 800; color: #22c55e; }
                .privacy-badges { display: flex; gap: 8px; }

                .privacy-summary h3 { margin-bottom: 20px; }
                .privacy-item { display: flex; gap: 15px; margin-bottom: 25px; }
                .privacy-item .icon { font-size: 1.5rem; }
                .privacy-item strong { display: block; font-size: 0.9rem; color: #fff; }
                .privacy-item p { font-size: 0.8rem; margin: 4px 0 0 0; opacity: 0.6; }
            `}</style>
        </div>
    );
}
