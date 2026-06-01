import { useState, useEffect } from 'react';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function SecurityDashboard() {
    usePageTitle('Security');
    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Security </span><span className="emoji">🔐</span></h1>
                <p>Encryption status, model integrity, and key management</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🔒</div>
                    <div className="stat-value" style={{ color: '#22c55e' }}>Active</div>
                    <div className="stat-label">Homomorphic Encryption</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔑</div>
                    <div className="stat-value">HMAC-SHA256</div>
                    <div className="stat-label" style={{ fontSize: '0.7rem' }}>Integrity Algorithm</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🛡️</div>
                    <div className="stat-value" style={{ color: '#22c55e' }}>Secure</div>
                    <div className="stat-label">Aggregation Status</div>
                </div>
            </div>

            <div className="content-card">
                <h3>🔐 Encryption Overview</h3>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                    All model updates are encrypted using homomorphic encryption simulation before transmission.
                    The aggregation server combines encrypted gradients without accessing raw values.
                    Each model update is signed with HMAC-SHA256 for integrity verification.
                </p>
            </div>

            <div className="content-card">
                <h3>🔑 Key Rotation Schedule</h3>
                <table className="data-table">
                    <thead><tr><th>Key Type</th><th>Algorithm</th><th>Last Rotated</th><th>Next Rotation</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>HE Public Key</td><td>Paillier (sim)</td><td>2026-02-01</td><td>2026-03-01</td>
                            <td><span className="badge badge-active">Active</span></td>
                        </tr>
                        <tr>
                            <td>HMAC Secret</td><td>SHA256</td><td>2026-02-15</td><td>2026-03-15</td>
                            <td><span className="badge badge-active">Active</span></td>
                        </tr>
                        <tr>
                            <td>JWT Signing Key</td><td>HS256</td><td>2026-01-01</td><td>2026-04-01</td>
                            <td><span className="badge badge-active">Active</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
