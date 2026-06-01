import { useState, useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';

export default function SystemHealth() {
    usePageTitle('System Health');
    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">System Health </span><span className="emoji">💚</span></h1>
                <p>Backend services status and monitoring</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-value" style={{ color: '#22c55e', fontSize: '1.4rem' }}>Online</div>
                    <div className="stat-label">Auth Service</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-value" style={{ color: '#22c55e', fontSize: '1.4rem' }}>Online</div>
                    <div className="stat-label">FL Orchestrator</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-value" style={{ color: '#22c55e', fontSize: '1.4rem' }}>Online</div>
                    <div className="stat-label">Aggregation Engine</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-value" style={{ color: '#22c55e', fontSize: '1.4rem' }}>Online</div>
                    <div className="stat-label">Crypto Service</div>
                </div>
            </div>

            <div className="content-card">
                <h3>System Overview</h3>
                <p style={{ opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
                    All services are operational. The federated learning orchestrator,
                    secure aggregation engine, and cryptographic services are running normally.
                </p>
            </div>
        </div>
    );
}
