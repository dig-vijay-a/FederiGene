import { useState, useEffect } from 'react';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    usePageTitle('Audit Logs');

    useEffect(() => {
        api.get('/platform/audit-logs')
            .then(res => setLogs(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const actionIcons = {
        login: '🔑', org_registered: '🏥', org_approved: '✅', org_rejected: '❌',
        dataset_registered: '🗂️', training_job_created: '🧠', model_download: '📥',
    };

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Audit Logs </span><span className="emoji">📋</span></h1>
                <p>Immutable record of all platform actions for compliance and security review</p>
            </div>

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : logs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No audit logs yet. Actions will be recorded here automatically.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th></th><th>Action</th><th>Resource</th><th>User</th><th>Timestamp</th>
                        </tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.id}>
                                    <td style={{ width: 32, textAlign: 'center' }}>{actionIcons[l.action] || '📝'}</td>
                                    <td style={{ fontWeight: 600 }}>{l.action.replace(/_/g, ' ')}</td>
                                    <td>{l.resource_type ? `${l.resource_type} #${l.resource_id}` : '—'}</td>
                                    <td>User #{l.user_id}</td>
                                    <td style={{ opacity: 0.6, fontSize: '0.82rem' }}>{new Date(l.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
