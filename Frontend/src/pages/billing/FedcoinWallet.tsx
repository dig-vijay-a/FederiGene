import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function FedcoinWallet() {
    const navigate = useNavigate();
    usePageTitle('FedCoin Wallet');

    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchWallet = () => {
        api.get('/marketplace/my-wallet')
            .then(res => setWallet(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchWallet();
        const interval = setInterval(fetchWallet, 10000); // Live polling
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><span className="gradient-text">FedCoin Wallet </span><img src="/coin_3d.png" alt="FC" style={{ width: 32, height: 32, verticalAlign: 'middle' }} /></h1>
                    <p>Track your token balance, data dividends, and marketplace transactions.</p>
                </div>
                <button className="action-btn" onClick={() => navigate('/org/billing')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>➕</span> Buy FedCoin
                </button>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading wallet...</p></div>
            ) : (
                <>
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '2rem' }}>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%)', borderColor: 'rgba(255, 215, 0, 0.3)' }}>
                            <div className="stat-icon" style={{ color: '#eab308' }}>💰</div>
                            <div className="stat-value">{wallet?.balance_fedcoin?.toLocaleString() || 0}</div>
                            <div className="stat-label">Current Balance (FC)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ color: '#22c55e' }}>📈</div>
                            <div className="stat-value">{wallet?.total_earned?.toLocaleString() || 0}</div>
                            <div className="stat-label">Lifetime Earned (FC)</div>
                        </div>
                    </div>

                    <div className="content-card">
                        <h3 style={{ margin: '0 0 1rem 0' }}>Transaction Ledger</h3>
                        {!wallet?.transactions || wallet.transactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">💸</div>
                                <p>No transactions yet. Participate in federated training or sell models to earn FedCoin.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Activity</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {wallet.transactions.map((t: any) => (
                                        <tr key={t.id}>
                                            <td style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                                                {new Date(t.timestamp).toLocaleString()}
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{t.activity}</td>
                                            <td>
                                                <span 
                                                    style={{ 
                                                        color: String(t.reward_amount).startsWith('-') ? '#ef4444' : '#22c55e',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {String(t.reward_amount).startsWith('-') || String(t.reward_amount).startsWith('+') 
                                                        ? t.reward_amount 
                                                        : `+${t.reward_amount}`}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
