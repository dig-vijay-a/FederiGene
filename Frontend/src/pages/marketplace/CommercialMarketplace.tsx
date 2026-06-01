import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';

export default function CommercialMarketplace() {
    usePageTitle('Commercial Ecosystem & Marketplace');

    const [catalog, setCatalog] = useState<any[]>([]);
    const [searchParams] = useSearchParams();
    const targetModelId = searchParams.get('model_id');
    const [wallet, setWallet] = useState({ balance_fedcoin: 0, total_earned: 0 });
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { user, refreshUser } = useAuth();

    const entityId = user?.organization?.id ? `ORG_${user.organization.id}` : `USER_${user?.id}`;

    const [subscribingTo, setSubscribingTo] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState(10); // Default 10 FedCoin

    useEffect(() => {
        loadMarketplaceData();
    }, [user]);

    const loadMarketplaceData = () => {
        setLoading(true);
        Promise.all([
            api.get('/marketplace/catalog'),
            api.get(`/marketplace/my-wallet`)
        ]).then(([catalogRes, walletRes]) => {
            let loadedModels = catalogRes.data.models;
            if (targetModelId) {
                loadedModels = loadedModels.filter((m: any) => m.id.toString() === targetModelId);
            }
            setCatalog(loadedModels);
            setWallet(walletRes.data);
            setLoading(false);
        }).catch(err => {
            console.error("Marketplace load failed", err);
            setLoading(false);
        });
    };

    const handleSubscribe = (modelId) => {
        setSubscribingTo(modelId);

        api.post('/marketplace/subscribe', {
            entity_id: entityId,
            model_id: modelId,
            payment_amount: paymentAmount
        }).then(res => {
            showToast(`Success! Purchased ${res.data.credits_added} API Inferences.`, 'success');
            setSubscribingTo(null);
            loadMarketplaceData(); // Refresh wallet
        }).catch(err => {
            showToast(err.response?.data?.detail || "Transaction Failed", 'error');
            setSubscribingTo(null);
        });
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1><span className="emoji">🛒</span><span className="gradient-text"> Commercial Ecosystem & API Marketplace</span></h1>
                    <p>Monetize validated global models via API and ensure fair, automated revenue sharing (via Smart Contracts) back to the hospitals that provided the training data.</p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Your Marketplace Wallet</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Wallet Balance</span>
                        <strong style={{ color: '#eab308' }}>{wallet.balance_fedcoin.toLocaleString()} fCOIN</strong>
                    </div>
                    {user?.organization && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Data Dividends</span>
                            <strong style={{ color: '#22c55e' }}>+ {wallet.total_earned.toLocaleString()} fCOIN</strong>
                        </div>
                    )}
                </div>
            </div>

            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Certified Models (API Access)</h3>
                    <span className="table-badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>Powered by FedCoin</span>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading catalog...</div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                        {catalog.map(model => (
                            <div key={model.id} style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-color)' }}>{model.name}</h4>
                                    <span className="status-badge active" style={{ fontSize: '0.75rem' }}>FDA Cleared</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                                    Developer: <strong>{model.developer}</strong> <br />
                                    Total API Calls: {(model.total_inferences / 1000000).toFixed(1)}M
                                </div>

                                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        <span>Cost per Inference:</span>
                                        <strong style={{ color: '#eab308' }}>{model.price_per_inference} fCOIN</strong>
                                    </div>

                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                        <div style={{ opacity: 0.7, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Smart Contract Revenue Split</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Data Providers:</span> <strong style={{ color: '#22c55e' }}>{model.revenue_share.data_providers}%</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Model Developer:</span> <strong>{model.revenue_share.developer}%</strong></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Platform Fee:</span> <strong style={{ opacity: 0.7 }}>{model.revenue_share.platform_fee}%</strong></div>
                                    </div>
                                </div>

                                {user?.organization?.name === model.developer ? (
                                    <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        You are earning {model.revenue_share.data_providers}% passive dividends from this model.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(parseFloat((e.target as any).value))}
                                            style={{ width: '100px' }}
                                            min="1"
                                        />
                                        <button
                                            className="action-btn"
                                            onClick={() => handleSubscribe(model.id)}
                                            disabled={subscribingTo === model.id}
                                            style={{ flex: 1, background: '#eab308', color: '#000' }}
                                        >
                                            {subscribingTo === model.id ? 'Processing...' : `Buy API Credits`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
