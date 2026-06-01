import { useState, useEffect } from 'react';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function ModelCompare() {
    usePageTitle('Compare Models');
    const [models, setModels] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);

    useEffect(() => {
        api.get('/platform/models').then(res => setModels(res.data)).catch(() => { });
    }, []);

    const toggleModel = (id) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) :
                prev.length < 3 ? [...prev, id] : prev // limit to 3
        );
    };

    const selectedModels = models.filter(m => selected.includes(m.id));

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Compare Models </span><span className="emoji">⚖️</span></h1>
                <p>Select up to 3 federated models to compare performance metrics side-by-side.</p>
            </div>

            <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                <h3>Select Models</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {models.map(m => (
                        <button
                            key={m.id}
                            onClick={() => toggleModel(m.id)}
                            className={`action-btn ${selected.includes(m.id) ? '' : 'outline'}`}
                            style={{
                                background: selected.includes(m.id) ? 'var(--accent-color)' : 'transparent',
                                color: selected.includes(m.id) ? '#fff' : 'var(--text-color)',
                                border: '1px solid var(--accent-color)',
                                fontSize: '0.85rem', padding: '6px 14px'
                            }}
                        >
                            {m.version} (Acc: {(m.accuracy * 100).toFixed(1)}%)
                        </button>
                    ))}
                    {models.length === 0 && <span style={{ opacity: 0.5 }}>No trained models found.</span>}
                </div>
            </div>

            {selectedModels.length > 0 ? (
                <div className="content-card">
                    <table className="data-table" style={{ tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th>Metric</th>
                                {selectedModels.map(m => <th key={m.id}>{m.version}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Accuracy</td>
                                {selectedModels.map(m => <td key={m.id} style={{ color: '#22c55e' }}>{(m.accuracy * 100).toFixed(2)}%</td>)}
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>F1 Score</td>
                                {selectedModels.map(m => <td key={m.id}>{(m.f1_score * 100).toFixed(2)}%</td>)}
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>AUC</td>
                                {selectedModels.map(m => <td key={m.id}>{(m.auc).toFixed(3)}</td>)}
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Loss (Final)</td>
                                {selectedModels.map(m => <td key={m.id} style={{ color: '#ef4444' }}>{(m.loss).toFixed(4)}</td>)}
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600 }}>Training Rounds</td>
                                {selectedModels.map(m => <td key={m.id}>{m.round_number} rounds</td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>Select multiple models above to compare.</p>
                </div>
            )}
        </div>
    );
}
