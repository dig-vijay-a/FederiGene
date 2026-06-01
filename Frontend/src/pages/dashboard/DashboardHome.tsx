// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function DashboardHome() {
    const { user } = useAuth();
    usePageTitle('Dashboard');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        api.get('/platform/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    const role = user?.role || 'researcher';
    const isAdmin = role === 'platform_admin';

    if (loading) return <div className="empty-state"><p>Loading dashboard…</p></div>;

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Welcome, {user?.username} </span><span className="emoji">👋</span></h1>
                <p>Federated Genomics Learning Platform — {isAdmin ? 'Platform Administration' : 'Research Dashboard'}</p>
            </div>

            <div className="stats-grid">
                {isAdmin ? (
                    <>
                        <StatCard icon="🏥" value={stats?.total_orgs || 0} label="Organizations" />
                        <StatCard icon="⏳" value={stats?.pending_orgs || 0} label="Pending Approvals" accent="warning" />
                        <StatCard icon="👤" value={stats?.total_users || 0} label="Total Users" />
                        <StatCard icon="🧠" value={stats?.total_jobs || 0} label="Training Jobs" />
                        <StatCard icon="⚡" value={stats?.active_jobs || 0} label="Active Jobs" accent="success" />
                        <StatCard icon="🗂️" value={stats?.total_datasets || 0} label="Datasets" />
                        <StatCard icon="📦" value={stats?.total_models || 0} label="Model Versions" />
                    </>
                ) : (
                    <>
                        <StatCard icon="🗂️" value={stats?.my_datasets || 0} label="My Datasets" />
                        <StatCard icon="🧠" value={stats?.total_jobs || 0} label="Training Jobs" />
                        <StatCard icon="⚡" value={stats?.active_jobs || 0} label="Active Jobs" accent="success" />
                        <StatCard icon="📦" value={stats?.total_models || 0} label="Models" />
                    </>
                )}
            </div>

            <div className="content-card">
                <h3>🚀 Quick Actions</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href="/training" className="action-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 20px' }}>New Training Job</a>
                    <a href="/datasets" className="action-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 20px' }}>Register Dataset</a>
                    {!user?.organization && (
                        <a href="/org/profile" className="action-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 20px', background: '#22c55e' }}>Register Organization</a>
                    )}
                </div>
            </div>

            <div className="content-card">
                <h3>ℹ️ Platform Info</h3>
                <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
                    FederiGene enables privacy-preserving federated learning on genomic data.
                    Hospitals and labs can train AI models collaboratively without sharing raw data,
                    using secure aggregation and encrypted model updates.
                    All actions are logged in an immutable audit trail.
                </p>
            </div>
        </div>
    );
}

function StatCard({ icon, value, label, accent }) {
    const bgMap = {
        warning: 'rgba(234, 179, 8, 0.1)',
        success: 'rgba(34, 197, 94, 0.1)',
    };

    return (
        <div className="stat-card" style={accent ? { background: bgMap[accent] } : {}}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
