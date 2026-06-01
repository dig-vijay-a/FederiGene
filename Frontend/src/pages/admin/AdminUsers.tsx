import { useState, useEffect } from 'react';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function AdminUsers() {
    usePageTitle('Admin | Users');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/all')
            .then(res => setUsers(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">All Users </span><span className="emoji">👤</span></h1>
                <p>Manage platform users, roles, and access across all organizations.</p>
            </div>

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : users.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👤</div>
                        <p>No users found on the platform.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>User ID</th><th>Username</th><th>Email</th><th>Global Role</th><th>Status</th>
                        </tr></thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ opacity: 0.6 }}>#{u.id}</td>
                                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`badge`} style={{
                                            background: u.role === 'platform_admin' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                                            color: u.role === 'platform_admin' ? '#ef4444' : '#8b5cf6'
                                        }}>
                                            {u.role.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td><span className="badge badge-active">Active</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
