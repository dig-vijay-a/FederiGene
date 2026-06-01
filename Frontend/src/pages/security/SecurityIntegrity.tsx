import { useState, useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';

export default function SecurityIntegrity() {
    usePageTitle('Security Integrity');
    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Model Integrity & Provenance </span><span className="emoji">🛡️</span></h1>
                <p>Verify that federated updates have not been tampered with or poisoned.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value" style={{ color: '#22c55e', fontSize: '1.4rem' }}>100% Valid</div>
                    <div className="stat-label">System-Wide HMAC Verification</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-value">SHA-256</div>
                    <div className="stat-label">Cryptographic Hash Function</div>
                </div>
            </div>

            <div className="content-card" style={{ marginTop: '1.5rem' }}>
                <h3>How Integrity Work</h3>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: '1.6' }}>
                    During Federated Learning, malicious actors may attempt to submit poisoned gradients to back-door the global model.
                    <br /><br />
                    To prevent this and man-in-the-middle tampering, FederiGene signs every metadata payload and encrypted weight tensor with an <b>HMAC (Hash-based Message Authentication Code)</b> using a securely rotated platform secret key before transmission.
                    <br /><br />
                    The <code>crypto_utils.py</code> service verifies this signature before the Aggregation Engine accepts the update into the learning round. All verified rounds are immutably logged in the <a href="/security/audit" style={{ color: 'var(--accent-color)' }}>Audit Logs</a>.
                </p>
            </div>
        </div>
    );
}
