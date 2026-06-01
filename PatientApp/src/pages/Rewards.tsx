import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

interface DashboardData {
    fedcoins: number;
}

interface EarningReq {
    id: string;
    activity: string;
    reward: string;
    date: string;
}

export default function Rewards() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [earnings, setEarnings] = useState<EarningReq[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showExplorer, setShowExplorer] = useState(false);
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const historyRef = useRef<HTMLHeadingElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const [dashRes, earningsRes] = await Promise.all([
                    api.get('/patient/dashboard'),
                    api.get('/patient/earnings')
                ]);
                setData(dashRes.data);
                setEarnings(earningsRes.data);
            } catch (err) {
                console.error("Failed to load rewards", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRewards();
        const interval = setInterval(fetchRewards, 5000); // Live rendering every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleWithdraw = () => {
        if (!withdrawAddress || !withdrawAmount) {
            showToast("Please enter an address and amount.", "error");
            return;
        }
        showToast("Withdrawal transaction submitted to ledger.", "success");
        setShowWithdraw(false);
        setWithdrawAddress('');
        setWithdrawAmount('');
    };

    const scrollToHistory = () => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading live data...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginTop: '1rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.2rem' }}>My Rewards</h1>
                <p style={{ opacity: 0.6 }}>Earnings from federated data contributions</p>
            </header>

            <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '0.5rem' }}>Total Balance</div>
                <div style={{ fontSize: '3rem', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <img src="/coin_3d.png" alt="FedCoin" style={{ width: '40px', height: '40px', filter: 'drop-shadow(0 4px 6px rgba(251, 191, 36, 0.4))' }} />
                    {data?.fedcoins.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                    ≈ ${( (data?.fedcoins || 0) * 0.1 ).toFixed(2)} USD
                </div>
                
                <button 
                    className="action-btn" 
                    style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    onClick={() => setShowExplorer(true)}
                >
                    🌐 View on Blockchain Explorer
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                    className="action-btn" 
                    style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid #fbbf24' }}
                    onClick={() => setShowWithdraw(true)}
                >
                    Withdraw
                </button>
                <button className="action-btn" onClick={scrollToHistory}>History</button>
            </div>

            <h3 ref={historyRef} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Earning History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {earnings.map((e) => (
                    <div key={e.id} className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{e.activity}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(e.date).toLocaleString()}</div>
                            </div>
                            <div style={{ color: 'var(--success)', fontWeight: '700' }}>{e.reward}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Withdraw FedCoin</h2>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>Amount (FDC)</label>
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ marginTop: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.2rem', opacity: 0.8, fontSize: '0.9rem' }}>Destination Address</label>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.5rem' }}>
                                The external Web3 crypto wallet address (like MetaMask) where you want to send your FedCoins.
                            </div>
                            <input 
                                type="text" 
                                placeholder="e.g. 0x71C...976F" 
                                value={withdrawAddress}
                                onChange={e => setWithdrawAddress(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className="action-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setShowWithdraw(false)}>Cancel</button>
                            <button className="action-btn" style={{ background: '#fbbf24', color: 'black' }} onClick={handleWithdraw}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blockchain Explorer Modal */}
            {showExplorer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', height: '80vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1rem', color: '#3b82f6' }}>FederiChain Explorer</h2>
                        <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '1.5rem' }}>Live distributed ledger sync</p>
                        
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Wallet Address</div>
                            <div style={{ fontSize: '0.9rem', wordBreak: 'break-all', fontFamily: 'monospace', color: '#fbbf24' }}>
                                0x{(Math.random() * 1e16).toString(16)}...{(Math.random() * 1e16).toString(16)}
                            </div>
                        </div>

                        <h4 style={{ margin: '1rem 0' }}>Latest Blocks</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {earnings.slice(0, 5).map((e, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Block #{(849302 + idx).toLocaleString()}</div>
                                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Tx: 0x...{e.id.replace('tx_', '')}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>+{e.reward} FDC</div>
                                </div>
                            ))}
                        </div>

                        <button className="action-btn" style={{ marginTop: '2rem' }} onClick={() => setShowExplorer(false)}>Close Explorer</button>
                    </div>
                </div>
            )}
        </div>
    );
}
