import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface DashboardData {
    fedcoins: number;
    aqi: number;
    passport_status: string;
    last_sync: string;
}

interface ConsentReq {
    id: string;
    study_name: string;
    requester: string;
    status: string;
    date: string;
}

interface EarningReq {
    id: string;
    activity: string;
    reward: string;
    date: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [consents, setConsents] = useState<ConsentReq[]>([]);
    const [earnings, setEarnings] = useState<EarningReq[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [dashRes, consentsRes, earningsRes] = await Promise.all([
                    api.get('/patient/dashboard'),
                    api.get('/patient/consents'),
                    api.get('/patient/earnings')
                ]);
                setData(dashRes.data);
                setConsents(consentsRes.data.filter((c: ConsentReq) => c.status === 'pending'));
                setEarnings(earningsRes.data.slice(0, 2)); // Show only recent 2
                
                // Sync FCM Token
                const fcmToken = localStorage.getItem('fcm_token');
                if (fcmToken) {
                    api.post('/patient/fcm-token', { token: fcmToken }).catch(e => console.error(e));
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
        const interval = setInterval(fetchDashboard, 5000); // Live rendering every 5 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading live data...</div>;

    return (
        <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem', paddingBottom: '6rem' }}>
            <header style={{ marginTop: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, opacity: 0.8 }}>Welcome back,</h2>
                <h1 className="gradient-text" style={{ fontSize: '2.2rem', margin: 0 }}>{user?.display_name || user?.username}</h1>
            </header>
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))' }}>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>Genomic Health Integrity</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800' }}>{data?.aqi || 0}</span>
                    <span style={{ fontSize: '1rem', opacity: 0.6 }}>% AQI</span>
                </div>
                <div style={{ marginTop: '1rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                    <div style={{ width: `${data?.aqi || 0}%`, height: '100%', background: 'var(--accent-light)', borderRadius: '3px', boxShadow: '0 0 10px var(--accent-light)' }}></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                        <img src="/coin_3d.png" alt="FedCoin" style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 4px 6px rgba(251, 191, 36, 0.4))' }} />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{data?.fedcoins.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>FedCoins</div>
                </div>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🧬</div>
                    <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{data?.passport_status}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Passport Status</div>
                </div>
            </div>

            {/* Prominent Notification Banner for Pending Consents */}
            {consents.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '1rem', padding: '1rem', borderLeft: '4px solid var(--danger)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fca5a5' }}>Action Required</h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                        You have {consents.length} organization(s) requesting permission to use your genomic data for training.
                    </p>
                </div>
            )}

            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Data Usage Approvals</h3>
                    {consents.length > 0 && <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{consents.length} Pending</span>}
                </div>
                
                {consents.length === 0 ? (
                    <div style={{ opacity: 0.6, fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                        ✅ No pending requests at the moment.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {consents.map(c => (
                            <div key={c.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#fbbf24' }}>{c.requester}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(c.date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Study: <strong>{c.study_name}</strong></div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem', marginBottom: '1rem' }}>
                                    They are requesting access to your de-identified genomic markers to train their Federated Learning model. You will earn FedCoins for contributing.
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        className="action-btn" 
                                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                        onClick={async () => {
                                            try {
                                                await api.post(`/patient/consent/${c.id}/reject`);
                                                setConsents(consents.filter(item => item.id !== c.id));
                                                alert("Request rejected.");
                                            } catch (err) {
                                                alert("Failed to reject request.");
                                            }
                                        }}
                                    >
                                        Deny
                                    </button>
                                    <button 
                                        className="action-btn" 
                                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', background: 'rgba(52, 211, 153, 0.1)', color: '#6ee7b7', border: '1px solid rgba(52, 211, 153, 0.3)' }}
                                        onClick={async () => {
                                            try {
                                                await api.post(`/patient/consent/${c.id}/approve`);
                                                setConsents(consents.filter(item => item.id !== c.id));
                                                alert("Data Access Approved! Smart Contract updated.");
                                            } catch (err) {
                                                alert("Failed to approve consent.");
                                            }
                                        }}
                                    >
                                        Approve & Earn
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Earnings</h3>
                {earnings.length === 0 ? (
                    <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>No recent earnings.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {earnings.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{item.activity}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(item.date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ color: 'var(--success)', fontWeight: '700', fontSize: '0.9rem' }}>{item.reward}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
