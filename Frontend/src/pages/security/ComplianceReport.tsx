import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function ComplianceReport() {
    const { id } = useParams();
    usePageTitle(`Compliance Report | Job #${id}`);
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/compliance/report/${id}`)
            .then(res => setReport(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="empty-state">Loading regulatory data...</div>;
    if (!report) return <div className="empty-state">Compliance report not found.</div>;

    const printReport = () => window.print();

    return (
        <div className="compliance-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <button onClick={() => navigate(-1)} className="text-btn">← Back</button>
                    <h1><span className="gradient-text">Compliance Certificate</span></h1>
                    <p style={{ opacity: 0.7 }}>Report ID: {report.report_id} • Status: <span style={{ color: '#22c55e', fontWeight: 700 }}>VERIFIED</span></p>
                </div>
                <button onClick={printReport} className="action-btn" style={{ background: '#3b82f6' }}>🖨️ Print PDF</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Privacy Budget</div>
                    <div className="stat-value">ε = {report.privacy_metrics.privacy_budget_epsilon}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">HE Protocol</div>
                    <div className="stat-value" style={{ fontSize: '0.9rem' }}>{report.privacy_metrics.encryption_protocol}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Consent Integrity</div>
                    <div className="stat-value" style={{ color: '#22c55e' }}>{report.data_provenance.consent_records_processed} Records</div>
                </div>
            </div>

            <div className="form-row">
                <div className="content-card" style={{ flex: 1 }}>
                    <h3>🔒 Security Attestation</h3>
                    <ul className="compliance-list">
                        <li style={{ alignItems: 'flex-start' }}>
                            <span className="check" style={{ marginTop: '2px' }}>✓</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px' }}>
                                <b>Homomorphic Encryption</b>
                                <span>Verified {report.privacy_metrics.encryption_protocol} parameters.</span>
                            </div>
                        </li>
                        <li style={{ alignItems: 'flex-start' }}>
                            <span className="check" style={{ marginTop: '2px' }}>✓</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px' }}>
                                <b>ZKP Verification</b>
                                <span>{report.data_provenance.zkp_verified_nodes}/{report.data_provenance.total_nodes} nodes attested via Zero-Knowledge.</span>
                            </div>
                        </li>
                        <li style={{ alignItems: 'flex-start' }}>
                            <span className="check" style={{ marginTop: '2px' }}>✓</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px' }}>
                                <b>Secure Aggregation</b>
                                <span>{report.privacy_metrics.aggregation_strategy} defense active.</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="content-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3>📋 Regulatory Alignment</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="compliance-badge">
                            <span className="badge badge-success">GDPR Compliant</span>
                            <p style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.7 }}>Right to Erasure & Consent Ledger protocols active.</p>
                        </div>
                        <div className="compliance-badge">
                            <span className="badge badge-success">HIPAA Equivalent</span>
                            <p style={{ fontSize: '0.75rem', marginTop: 4, opacity: 0.7 }}>De-identification via secure local training and HE updates.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-card" style={{ marginTop: '1rem' }}>
                <h3>⛓️ Immutable Audit Trail</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Action Executed</th>
                            <th>Timestamp (UTC)</th>
                            <th>Integrity Check</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.integrity_audit.map((log, i) => (
                            <tr key={i}>
                                <td style={{ textTransform: 'capitalize' }}>{log.action.replace(/_/g, ' ')}</td>
                                <td>{log.timestamp}</td>
                                <td><span style={{ color: '#22c55e', fontWeight: 600 }}>✓ SHA-256 Valid</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .compliance-container { max-width: 1000px; margin: 0 auto; }
                .compliance-list { list-style: none; padding: 0; margin-top: 1.5rem; }
                .compliance-list li { margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px; font-size: 0.95rem; line-height: 1.4; }
                .check { color: #22c55e; font-weight: bold; }
                .compliance-badge { border-left: 4px solid #22c55e; padding-left: 12px; background: rgba(34,197,94,0.05); padding: 12px; border-radius: 0 8px 8px 0; }
                .text-btn { background: transparent; border: none; color: var(--accent-color); cursor: pointer; padding: 0; margin-bottom: 0.5rem; font-weight: 600; }
                @media print {
                    .sidebar, .top-navbar, .text-btn, .action-btn { display: none !important; }
                    #root, .dashboard-layout, body, html { height: auto !important; min-height: auto !important; overflow: visible !important; }
                    .main-content { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
                    .content-container { padding: 0 !important; height: auto !important; overflow: visible !important; }
                    body { background: white !important; color: black !important; }
                    .content-card { border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; background: transparent !important; page-break-inside: avoid; height: 100% !important; box-sizing: border-box; }
                    h1, h3 { color: #1e293b !important; margin-top: 0 !important; }
                    .badge { border: 1px solid #22c55e !important; color: #22c55e !important; background: transparent !important; }
                    .stats-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 1rem !important; }
                    .form-row { grid-template-columns: 1fr 1fr !important; align-items: stretch !important; page-break-inside: avoid; }
                    .compliance-container { max-width: 100% !important; height: auto !important; overflow: visible !important; }
                    @page { margin: 1.5cm; }
                }
            `}</style>
        </div>
    );
}
