import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function GlobalSovereignty() {
    usePageTitle('Global AI Sovereignty');
    const { showToast } = useToast();

    // DAO Voting State
    const [proposals, setProposals] = useState<any[]>([]);
    const [votingOn, setVotingOn] = useState<any>(null);
    const [currentNode] = useState("ORG_UCSF"); // Simulated currently logged-in acting node

    // Data Residency Simulator State
    const [resSource, setResSource] = useState('node_berlin_1');
    const [resTarget, setResTarget] = useState('node_sf_1');
    const [resType, setResType] = useState('raw_weights');
    const [resResult, setResResult] = useState<any>(null);
    const [checkingRes, setCheckingRes] = useState(false);

    useEffect(() => {
        loadProposals();
    }, []);

    const loadProposals = () => {
        api.get('/sovereignty/proposals')
            .then(res => setProposals(res.data.proposals || []))
            .catch(err => console.error("Failed to load DAO proposals", err));
    };

    const handleVote = (proposalId, voteType) => {
        setVotingOn(proposalId);
        api.post('/sovereignty/vote', {
            proposal_id: proposalId,
            node_id: currentNode,
            vote: voteType
        }).then(res => {
            showToast(res.data.message, 'success');
            setVotingOn(null);
            loadProposals();
        }).catch(err => {
            showToast(err.response?.data?.detail || "Vote failed", 'error');
            setVotingOn(null);
        });
    };

    const handleCheckResidency = () => {
        setCheckingRes(true);
        setResResult(null);

        api.post('/sovereignty/check-residency', {
            source_node: resSource,
            target_node: resTarget,
            payload_type: resType
        }).then(res => {
            setResResult(res.data);
            setCheckingRes(false);
        }).catch(err => {
            if (err.response?.status === 403) {
                setResResult(err.response.data.detail);
            } else {
                showToast("Residency check failed entirely.", 'error');
            }
            setCheckingRes(false);
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🌍</span><span className="gradient-text"> Global AI Sovereignty & Governance</span></h1>
                <p>Decentralized decision-making via institutional DAO voting and strict cross-border Data Residency (GDPR/HIPAA) enforcement algorithms.</p>
            </div>

            <div className="grid-2">
                {/* DAO Proposal Voting */}
                <div className="content-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>⚖️ Active Network Proposals</h3>
                        <span className="status-badge" style={{ fontSize: '0.75rem' }}>Operating as {currentNode}</span>
                    </div>

                    {proposals.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No active proposals found.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {proposals.map(prop => (
                                <div key={prop.id} style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{prop.title}</h4>
                                        <span className={`status-badge ${prop.status === 'active' ? 'active' : ''}`}>{prop.status.toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>Proposed by: {prop.proposer}</div>

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e' }}><span>👍 FOR:</span> <strong>{prop.votes_for}</strong></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}><span>👎 AGAINST:</span> <strong>{prop.votes_against}</strong></div>
                                        <div style={{ flex: 1, textAlign: 'right', opacity: 0.8 }}>Requires: {prop.quorum_required}</div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem', display: 'flex' }}>
                                        <div style={{ width: `${(prop.votes_for / prop.quorum_required) * 100}%`, background: '#22c55e' }}></div>
                                        <div style={{ width: `${(prop.votes_against / prop.quorum_required) * 100}%`, background: '#ef4444' }}></div>
                                    </div>

                                    {prop.status === 'active' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="action-btn"
                                                onClick={() => handleVote(prop.id, 'for')}
                                                disabled={votingOn === prop.id}
                                                style={{ flex: 1, background: '#22c55e' }}
                                            >
                                                Vote FOR
                                            </button>
                                            <button
                                                className="action-btn secondary"
                                                onClick={() => handleVote(prop.id, 'against')}
                                                disabled={votingOn === prop.id}
                                                style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }}
                                            >
                                                Vote AGAINST
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Data Residency Simulator */}
                <div className="content-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3>🛡️ Cross-Border Residency Enforcer</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Simulate the transmission of high-dimensional tensors between sovereign nations. The API will dynamically block illegal transfers based on regional definitions (e.g. EU GDPR Article 44).
                    </p>

                    <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Source Node (Data Origin)</label>
                                <select className="form-input" value={resSource} onChange={e => setResSource((e.target as any).value)} style={{ width: '100%' }}>
                                    <option value="node_berlin_1">Charité Berlin (EU-CENTRAL)</option>
                                    <option value="node_sf_1">UCSF Medical (US-WEST)</option>
                                    <option value="node_tokyo_1">Tokyo Med (AP-NORTHEAST)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem', opacity: 0.5 }}>➡️</div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Target Node (Receiver)</label>
                                <select className="form-input" value={resTarget} onChange={e => setResTarget((e.target as any).value)} style={{ width: '100%' }}>
                                    <option value="node_sf_1">UCSF Medical (US-WEST)</option>
                                    <option value="node_berlin_1">Charité Berlin (EU-CENTRAL)</option>
                                    <option value="node_tokyo_1">Tokyo Med (AP-NORTHEAST)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Payload Structure</label>
                            <select className="form-input" value={resType} onChange={e => setResType((e.target as any).value)} style={{ width: '100%' }}>
                                <option value="raw_weights">Raw Model Weight Gradients (High Risk)</option>
                                <option value="patient_embeddings">Patient Latent Embeddings (High Risk)</option>
                                <option value="dp_noised">Differential Privacy Noised Aggregates (Moderate Risk)</option>
                                <option value="zkp_attestation">Zero-Knowledge Proof Attestation (Low Risk)</option>
                            </select>
                        </div>

                        <button className="action-btn" onClick={handleCheckResidency} disabled={checkingRes} style={{ width: '100%' }}>
                            {checkingRes ? 'Evaluating Inter-continental Pact...' : '🔎 Inspect Data Transfer Policy'}
                        </button>
                    </div>

                    {resResult && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: resResult.action === 'BLOCKED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${resResult.action === 'BLOCKED' ? '#ef4444' : '#22c55e'}`,
                            animation: 'fadeIn 0.3s ease'
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: resResult.action === 'BLOCKED' ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {resResult.action === 'BLOCKED' ? '🛑 TRANSFER BLOCKED (ILLEGAL)' : '✅ TRANSFER ALLOWED'}
                            </h4>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: '1.5' }}>
                                <strong>Reasoning:</strong> {resResult.reason}
                            </div>
                            {resResult.mitigation && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                                    <strong>Mitigation:</strong> {resResult.mitigation}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
