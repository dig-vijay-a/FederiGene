import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function TrustExplorer() {
    usePageTitle('Decentralized Trust Explorer');
    const { showToast } = useToast();
    const [ledger, setLedger] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchHash, setSearchHash] = useState('');
    const [verifyResult, setVerifyResult] = useState<any>(null);

    // Org DIDs for DUA deployment simulation
    const [providerDid] = useState('did:ethr:0x12a9b3... (UCSF Medical)');
    const [consumerDid] = useState('did:ethr:0x44f1c7... (GenomicTech AI)');
    const [deployingDua, setDeployingDua] = useState(false);

    useEffect(() => {
        loadLedger();
    }, []);

    const loadLedger = () => {
        setLoading(true);
        api.get('/trust/ledger?limit=5')
            .then(res => setLedger(res.data))
            .catch(err => console.error("Failed to load blockchain ledger:", err))
            .finally(() => setLoading(false));
    };

    const handleVerify = (e) => {
        e.preventDefault();
        if (!searchHash) return;

        setVerifyResult(null);
        api.get(`/trust/verify/${searchHash}`)
            .then(res => setVerifyResult({ success: true, ...res.data }))
            .catch(err => setVerifyResult({
                success: false,
                error: err.response?.data?.detail || "Cryptographic verification failed."
            }));
    };

    const handleDeployDua = () => {
        setDeployingDua(true);
        api.post('/trust/dua/deploy', {
            dataset_id: 1,
            consumer_did: consumerDid,
            provider_did: providerDid,
            terms: 'No secondary use. Weights must be DP (Epsilon <= 2.0). Data stays resident.'
        })
            .then(() => {
                showToast("DUA Smart Contract Deployed to Ethereum Sidechain", 'success');
                loadLedger(); // Refresh blocks
            })
            .catch(err => showToast("Failed to deploy DUA Smart Contract", 'error'))
            .finally(() => setDeployingDua(false));
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">⛓️</span><span className="gradient-text"> Trust Explorer (Immutable Ledger)</span></h1>
                <p>Verify federated model weights, Data Usage Agreements (DUAs), and ZKP validations on the Ethereum Sidechain.</p>
            </div>

            <div className="grid-2">
                {/* Block Explorer */}
                <div className="content-card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3>Network Blocks</h3>
                            {ledger && <span className="status-badge active" style={{ marginTop: '0.5rem', display: 'inline-block' }}>Connected: {ledger.network}</span>}
                        </div>
                        <button className="action-btn secondary" onClick={loadLedger} disabled={loading}>
                            🔄 Sync Chain
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>Syncing nodes...</div>
                    ) : ledger ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {ledger.blocks.map(block => (
                                <div key={block.block_number} style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary-color)' }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0 }}>Block #{block.block_number}</h4>
                                        <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                                            {new Date(block.timestamp * 1000).toLocaleString()}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', wordBreak: 'break-all' }}>
                                        <span style={{ color: '#8b5cf6' }}>Hash:</span> {block.hash}
                                    </div>

                                    <div>
                                        <strong>Transactions ({block.transactions.length}):</strong>
                                        {block.transactions.map((txn, i) => (
                                            <div key={i} style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: '2px solid #22c55e' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold', color: '#22c55e' }}>
                                                        {txn.type ? txn.type.replace(/_/g, ' ') : 'UNKNOWN TRANSACTION'}
                                                    </span>
                                                    {txn.txn_id && (
                                                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.7 }}>
                                                            {txn.txn_id.substring(0, 16)}...
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Smart Contract Deploy Payload */}
                                                {txn.type === 'smart_contract_deploy' && (
                                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9 }}>
                                                        <div><span style={{ opacity: 0.7 }}>Provider DID:</span> {txn.provider ? txn.provider.substring(0, 25) : 'Unknown'}...</div>
                                                    </div>
                                                )}

                                                {/* Round Anchor Payload */}
                                                {txn.type === 'round_anchor' && (
                                                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9 }}>
                                                        <div><span style={{ opacity: 0.7 }}>Job:</span> {txn.job_id} | <span style={{ opacity: 0.7 }}>Round:</span> {txn.round}</div>
                                                        <div style={{ wordBreak: 'break-all', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                                            <span style={{ opacity: 0.7 }}>Sig:</span> {txn.signature}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>Failed to load ledger data.</div>
                    )}
                </div>

                {/* Cryptographic Verification */}
                <div className="content-card">
                    <h3>Cryptographic Verification</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Input a Transaction Hash to verify its existence and state on the immutable ledger.
                    </p>

                    <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="0x... (Txn Hash)"
                            value={searchHash}
                            onChange={e => setSearchHash((e.target as any).value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="action-btn">Verify</button>
                    </form>

                    {verifyResult && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: verifyResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${verifyResult.success ? '#22c55e' : '#ef4444'}`
                        }}>
                            {verifyResult.success ? (
                                <>
                                    <h4 style={{ color: '#22c55e', margin: '0 0 0.5rem 0' }}>✅ Verified on Ledger</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                                        <li><strong>Block:</strong> #{verifyResult.data.block_number}</li>
                                        <li><strong>Confirmations:</strong> {verifyResult.data.confirmations}</li>
                                        <li><strong>Confidence:</strong> Mathematically Immutable</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0' }}>❌ Verification Failed</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>{verifyResult.error}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* DUA Smart Contracts */}
                <div className="content-card">
                    <h3>Data Usage Agreements (DUA)</h3>
                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Deploy cryptographic Smart Contracts defining exactly how a hospital's data can be used.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#3b82f6' }}>Consumer DID:</strong> {consumerDid}</div>
                        <div><strong style={{ color: '#8b5cf6' }}>Provider DID:</strong> {providerDid}</div>
                    </div>

                    <button
                        className="action-btn"
                        onClick={handleDeployDua}
                        disabled={deployingDua}
                        style={{ width: '100%', padding: '12px', background: '#3b82f6' }}
                    >
                        {deployingDua ? 'Deploying to Chain...' : '📜 Deploy Smart Contract DUA'}
                    </button>
                </div>
            </div>
        </div>
    );
}
