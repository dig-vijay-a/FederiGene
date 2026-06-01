import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function ApiKeys() {
    const { user } = useAuth();
    usePageTitle('API Keys');
    const { showToast } = useToast();
    const [keys, setKeys] = useState<any[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [loading, setLoading] = useState(true);
    const [generatedSecret, setGeneratedSecret] = useState<any>(null);

    if (!user?.organization) {
        return (
            <div>
                <div className="page-header">
                    <h1><span className="gradient-text">API Credentials </span><span className="emoji">🔑</span></h1>
                    <p>Generate keys for your local hospital servers to programmatically connect to the FederiGene orchestrator.</p>
                </div>
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon">🏥</div>
                        <p>No organization registered yet.</p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>You must belong to an organization to generate and manage API keys.</p>
                    </div>
                </div>
            </div>
        );
    }

    const fetchKeys = () => {
        setLoading(true);
        api.get('/platform/org/api-keys')
            .then(res => setKeys(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!newKeyName) return;
        api.post('/platform/org/api-keys', { name: newKeyName })
            .then(res => {
                setGeneratedSecret(res.data.api_key);
                setNewKeyName("");
                fetchKeys();
                showToast(res.data.message, 'success');
            })
            .catch(err => showToast("Failed to generate key", 'error'));
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">API Credentials </span><span className="emoji">🔑</span></h1>
                <p>Generate keys for your local hospital servers to programmatically connect to the FederiGene orchestrator.</p>
            </div>

            {generatedSecret && (
                <div className="content-card" style={{ marginBottom: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e' }}>
                    <h3 style={{ color: '#22c55e', marginTop: 0 }}>🎉 Key Generated Successfully!</h3>
                    <p style={{ fontSize: '0.9rem' }}>Please copy this secret now. It will <b>never</b> be shown again for security reasons.</p>
                    <div style={{ background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', color: '#fff', fontSize: '1rem', overflowX: 'auto' }}>
                        {generatedSecret}
                    </div>
                    <button className="action-btn" style={{ marginTop: '1rem' }} onClick={() => setGeneratedSecret(null)}>I have saved it</button>
                </div>
            )}

            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Active Service Keys</h3>
                    {user?.role === 'hospital_admin' && (
                        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="e.g. Local GPU Cluster"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName((e.target as any).value)}
                                required
                            />
                            <button type="submit" className="action-btn" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>+ Generate</button>
                        </form>
                    )}
                </div>

                <table className="data-table">
                    <thead><tr><th>Name</th><th>Prefix</th><th>Created</th><th>Last Used</th><th>Status</th></tr></thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>}
                        {!loading && keys.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>No API keys generated yet.</td></tr>
                        )}
                        {!loading && keys.map(k => (
                            <tr key={k.id}>
                                <td style={{ fontWeight: 600 }}>{k.name}</td>
                                <td style={{ fontFamily: 'monospace', opacity: 0.8 }}>{k.identifier}</td>
                                <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(k.created_at).toLocaleDateString()}</td>
                                <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                                <td><span className={k.is_active ? "badge badge-active" : "badge"}>{k.is_active ? 'Active' : 'Revoked'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="content-card" style={{ marginTop: '1.5rem' }}>
                <h3>Integration Code Example</h3>
                <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '1rem' }}>Use your API key to authenticate the official FederiGene Python client on your hospital's secure servers.</p>
                <div style={{ background: '#1e1e1e', padding: '1rem', borderRadius: 8, overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', color: '#d4d4d4' }}>
                    <span style={{ color: '#c586c0' }}>import</span> federigene_client <span style={{ color: '#c586c0' }}>as</span> fg<br /><br />
                    <span style={{ color: '#6a9955' }}># Initialize the client with your API key</span><br />
                    client = fg.Client(api_key=<span style={{ color: '#ce9178' }}>"fg_live_..."</span>)<br /><br />
                    <span style={{ color: '#6a9955' }}># Connect your local model to a training job</span><br />
                    client.join_federated_job(job_id=<span style={{ color: '#b5cea8' }}>42</span>, local_dataset_path=<span style={{ color: '#ce9178' }}>"/secure/data/patients.csv"</span>)<br />
                </div>
            </div>
        </div>
    );
}
