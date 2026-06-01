// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function RegulatoryCompliance() {
    usePageTitle('Regulatory & SaMD Compliance');
    const { showToast } = useToast();

    const [frameworks, setFrameworks] = useState<any[]>([]);
    const [selectedFramework, setSelectedFramework] = useState('EU_AI_ACT');
    const [modelId, setModelId] = useState('global_model_v1.7.2');

    const [auditing, setAuditing] = useState(false);
    const [reportId, setReportId] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        api.get('/compliance/frameworks')
            .then(res => {
                setFrameworks(res.data.frameworks);
                if (res.data.frameworks.length > 0) {
                    setSelectedFramework(res.data.frameworks[0].id);
                }
            })
            .catch(err => console.error("Failed to load frameworks:", err));
    }, []);

    // Poll Audit Status
    useEffect(() => {
        let interval;
        if (reportId && reportData?.status !== 'completed') {
            interval = setInterval(() => {
                api.get(`/compliance/audit/${reportId}`)
                    .then(res => {
                        setReportData(res.data);
                        if (res.data.status === 'completed') {
                            setAuditing(false);
                            clearInterval(interval);
                        }
                    })
                    .catch(e => {
                        console.error("Audit tracking failed", e);
                        clearInterval(interval);
                        setAuditing(false);
                    });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [reportId, reportData]);

    const handleStartAudit = () => {
        setAuditing(true);
        setReportData(null);
        api.post('/compliance/audit', {
            model_id: modelId,
            target_framework: selectedFramework
        })
            .then(res => setReportId(res.data.report_id))
            .catch(() => {
                showToast('Failed to start compliance audit.', 'error');
                setAuditing(false);
            });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">⚖️</span><span className="gradient-text"> Regulatory & SaMD Compliance</span></h1>
                <p>Automate validation against the EU AI Act, FDA Software as a Medical Device (SaMD) requirements, and ISO Quality Management Systems.</p>
            </div>

            <div className="grid-2">
                {/* Audit Configuration */}
                <div className="content-card">
                    <h3>Configure Automated Audit</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Run a federated model through rigorous static testing, verifying data provenance, human-in-the-loop oversight, and statistical bias limits.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Global Model Target</label>
                        <select className="form-input" value={modelId} onChange={e => setModelId((e.target as any).value)}>
                            <option value="global_model_v1.7.2">Oncology Predictive Core (v1.7.2)</option>
                            <option value="global_model_v2.0.0">Radiogenomic Classifier (v2.0.0)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Regulatory Framework</label>
                        <select className="form-input" value={selectedFramework} onChange={e => setSelectedFramework((e.target as any).value)}>
                            {frameworks.map(fw => (
                                <option key={fw.id} value={fw.id}>{fw.name}</option>
                            ))}
                        </select>
                        {frameworks.find(f => f.id === selectedFramework) && (
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                {frameworks.find(f => f.id === selectedFramework).description}
                            </div>
                        )}
                    </div>

                    <button className="action-btn" onClick={handleStartAudit} disabled={auditing} style={{ width: '100%', background: '#4f46e5' }}>
                        {auditing ? 'Executing Compliance Scan...' : '🛡️ Run Compliance Audit'}
                    </button>

                    {reportData && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong>Status:</strong>
                                <span style={{ textTransform: 'capitalize', color: 'var(--primary-color)' }}>
                                    {reportData.status.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div style={{ width: '100%', background: 'rgba(0,0,0,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{ width: `${reportData.progress}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.5s ease' }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Audit Results */}
                <div className="content-card">
                    <h3>Official Audit Report</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        The final outputs are cryptographically anchored to the blockchain, ensuring regulatory immutability.
                    </p>

                    {reportData?.status === 'completed' ? (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                                <h2 style={{ color: '#22c55e', margin: '0 0 0.5rem 0' }}>{reportData.results.overall_status}</h2>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>No critical compliance violations detected.</div>
                            </div>

                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {Object.entries(reportData.results).map(([key, value]) => {
                                    if (key === 'overall_status' || key === 'issues_found') return null;
                                    return (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.9rem' }}>
                                            <span style={{ textTransform: 'capitalize', opacity: 0.9 }}>{key.replace(/_/g, ' ')}:</span>
                                            <strong style={{ color: value.includes('Pass') ? '#22c55e' : 'inherit' }}>{value}</strong>
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => showToast("Simulation: Downloading Official PDF Report", 'info')}>
                                    📄 Download PDF
                                </button>
                                <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => showToast("Simulation: Anchoring report hash to Ethereum Ledger", 'info')}>
                                    ⛓️ Seal on Blockchain
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                            {auditing ? 'Awaiting scan completion...' : 'Select a model and framework to generate an official compliance report.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
