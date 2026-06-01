import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function AutonomousAgents() {
    usePageTitle('Autonomous Clinical Agents');
    const { showToast } = useToast();

    const [agents, setAgents] = useState<any[]>([]);
    const [hypotheses, setHypotheses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [scanningAgent, setScanningAgent] = useState<any>(null);
    const [scanTopic, setScanTopic] = useState('Immunotherapy Resistance');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            api.get('/agents/roster'),
            api.get('/agents/hypotheses')
        ]).then(([rosterRes, hypRes]) => {
            setAgents(rosterRes.data.agents);
            setHypotheses(hypRes.data.hypotheses);
            setLoading(false);
        }).catch(err => {
            console.error("Agent data load failed", err);
            setLoading(false);
        });
    };

    const handleTriggerScan = (agentId) => {
        setScanningAgent(agentId);
        api.post('/agents/scan', {
            agent_id: agentId,
            topic: scanTopic
        }).then(res => {
            showToast(res.data.message, 'success');
            setScanningAgent(null);
            loadData(); // Refresh list
        }).catch(err => {
            showToast("Agent scan failed.", 'error');
            setScanningAgent(null);
        });
    };

    const handleApprove = (hypId) => {
        api.post(`/agents/approve/${hypId}`)
            .then(res => {
                showToast(res.data.message, 'success');
                loadData();
            })
            .catch(err => showToast("Approval failed.", 'error'));
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">🤖</span><span className="gradient-text"> Autonomous Clinical Agents</span></h1>
                <p>Collaborate with LLM-powered researchers that independently scan global medical telemetry, formulate clinical hypotheses, and orchestrate federated rings.</p>
            </div>

            <div className="grid-2">
                {/* Agent Roster */}
                <div className="content-card">
                    <h3>🕵️ Active Research Roster</h3>
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                        {agents.map(agent => (
                            <div key={agent.id} style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>{agent.name}</h4>
                                    <span className="table-badge" style={{ fontSize: '0.7rem' }}>{agent.model}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '1rem' }}>
                                    Status: <strong style={{ color: agent.status.includes('orchestrating') ? '#22c55e' : 'inherit' }}>{agent.status.replace(/_/g, ' ')}</strong><br />
                                    Latest Discovery: {agent.last_discovery}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        className="form-input"
                                        value={scanTopic}
                                        onChange={e => setScanTopic((e.target as any).value)}
                                        style={{ flex: 1, fontSize: '0.85rem' }}
                                        placeholder="Research Topic..."
                                    />
                                    <button
                                        className="action-btn"
                                        onClick={() => handleTriggerScan(agent.id)}
                                        disabled={scanningAgent === agent.id}
                                        style={{ background: 'var(--primary-color)' }}
                                    >
                                        {scanningAgent === agent.id ? 'Thinking...' : 'Command Scan'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hypotheses Feed */}
                <div className="content-card">
                    <h3>💡 AI-Generated Hypotheses</h3>
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                        {hypotheses.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hypotheses generated yet.</div>
                        ) : (
                            hypotheses.map(hyp => (
                                <div key={hyp.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: hyp.status === 'deployed_to_network' ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', maxWidth: '80%' }}>{hyp.title}</h4>
                                        <div style={{ background: '#22c55e', color: '#fff', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            {(hyp.confidence_score * 100).toFixed(0)}% Conf
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.4', marginBottom: '1rem' }}>
                                        {hyp.rationale}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className={`status-badge ${hyp.status === 'deployed_to_network' ? 'active' : ''}`} style={{ fontSize: '0.75rem' }}>
                                            {hyp.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                        {hyp.status === 'awaiting_human_approval' && (
                                            <button className="action-btn" onClick={() => handleApprove(hyp.id)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                                Approve & Launch FL Ring
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
