import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function MarketplaceHome() {
    usePageTitle('Model Marketplace');
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ specialty: '', minAcc: 0 });

    useEffect(() => {
        const fetchMarketplace = () => {
            const query = `?specialty=${filter.specialty}&min_accuracy=${filter.minAcc / 100}`;
            api.get(`/marketplace/models${query}`)
                .then(res => setModels(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        };
        fetchMarketplace();
        const interval = setInterval(fetchMarketplace, 10000);
        return () => clearInterval(interval);
    }, [filter]);

    return (
        <div className="marketplace-container">
            <div className="page-header">
                <h1><span className="gradient-text">Federated Marketplace</span></h1>
                <p>Discover and license pre-trained genomic models from the network.</p>
            </div>

            <div className="filter-bar content-card">
                <div className="filter-group">
                    <label>Medical Specialty</label>
                    <select className="form-input" value={filter.specialty} onChange={e => setFilter(f => ({ ...f, specialty: (e.target as any).value }))}>
                        <option value="">All Specialties</option>
                        <option value="Oncology">Oncology</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Rare Diseases">Rare Diseases</option>
                        <option value="Pharmacogenomics">Pharmacogenomics</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Min Accuracy: {filter.minAcc}%</label>
                    <input
                        type="range" min="0" max="100" value={filter.minAcc}
                        onChange={e => setFilter(f => ({ ...f, minAcc: (e.target as any).value }))}
                    />
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Loading global registry...</div>
            ) : models.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏪</div>
                    <p>No models matching your criteria are currently listed.</p>
                </div>
            ) : (
                <div className="marketplace-grid">
                    {models.map(model => (
                        <div key={model.id} className="model-card glass-card">
                            <div className="model-badge">{model.specialty}</div>
                            <h3>{model.architecture.toUpperCase()} Base</h3>
                            <p className="model-version">Version {model.version}</p>

                            <div className="metrics-row">
                                <div className="m-item">
                                    <span className="m-label">Accuracy</span>
                                    <span className="m-val">{(model.accuracy * 100).toFixed(1)}%</span>
                                </div>
                                <div className="m-item">
                                    <span className="m-label">AUC</span>
                                    <span className="m-val">{(model.auc * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            <p className="model-desc">
                                {model.metadata?.description || "High-performance genomic model trained on private datasets."}
                            </p>

                                <Link to={`/marketplace/commercial?model_id=${model.id}`} style={{ width: '100%' }}>
                                    <button className="market-btn">Request Access / License</button>
                                </Link>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .marketplace-container { max-width: 1200px; }
                .filter-bar { display: flex; gap: 2rem; margin-bottom: 2rem; align-items: flex-end; }
                .filter-group { display: flex; flex-direction: column; gap: 8px; flex: 1; }
                
                .marketplace-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .model-card { padding: 1.5rem; display: flex; flex-direction: column; position: relative; overflow: hidden; }
                .model-badge { position: absolute; top: 1rem; right: 1rem; background: rgba(139,92,246,0.15); color: #8b5cf6; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
                .model-version { font-size: 0.8rem; opacity: 0.5; margin-bottom: 1rem; }
                
                .metrics-row { display: flex; gap: 2rem; margin-bottom: 1rem; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; }
                .m-item { display: flex; flex-direction: column; }
                .m-label { font-size: 0.7rem; opacity: 0.6; text-transform: uppercase; }
                .m-val { font-weight: 700; color: #22c55e; font-size: 1.1rem; }
                
                .model-desc { font-size: 0.85rem; opacity: 0.8; line-height: 1.5; margin-bottom: 1.5rem; flex: 1; }
                .market-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
                .market-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
            `}</style>
        </div>
    );
}
