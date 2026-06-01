import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function TeamMembers() {
    const { user } = useAuth();
    usePageTitle('Team Members');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [form, setForm] = useState({ user_id: '', role: 'researcher' });
    const [error, setError] = useState<any>(null);
    const [success, setSuccess] = useState<any>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]); // In a real app, this would be a search endpoint

    useEffect(() => {
        fetchMembers();
        // For the sake of this prototype demo, we'll fetch all users to populate the dropdown
        api.get('/users/all').then(res => setAllUsers(res.data)).catch(() => { });
    }, []);

    const fetchMembers = () => {
        setLoading(true);
        api.get('/platform/orgs/members')
            .then(res => setMembers(res.data))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        try {
            const res = await api.post('/platform/orgs/members', {
                user_id: parseInt(form.user_id),
                role: form.role
            });
            setSuccess(res.data.message);
            setShowInvite(false);
            setForm({ user_id: '', role: 'researcher' });
            fetchMembers();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add member');
        }
    };

    const isHospitalAdmin = user?.role === 'hospital_admin';

    if (!user?.organization) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🏥</div>
                <p>Register an organization first to manage team members.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><span className="gradient-text">Team Members </span><span className="emoji">👥</span></h1>
                    <p>Manage researchers and data custodians in {user.organization.name}</p>
                </div>
                {isHospitalAdmin && (
                    <button className="action-btn" onClick={() => setShowInvite(!showInvite)} style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                        {showInvite ? '✕ Cancel' : '+ Add Member'}
                    </button>
                )}
            </div>

            {success && <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

            {showInvite && isHospitalAdmin && (
                <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                    <h3>Add Team Member</h3>
                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
                    <form onSubmit={handleInvite}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Select User to Add</label>
                                <select className="form-input" required value={form.user_id} onChange={e => setForm({ ...form, user_id: (e.target as any).value })}>
                                    <option value="" disabled>Select a registered user...</option>
                                    {allUsers.filter(u => !members.find(m => m.user_id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '4px 0 0' }}>The user must have registered an account on the platform first.</p>
                            </div>
                            <div className="form-group">
                                <label>Assign Role</label>
                                <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: (e.target as any).value })}>
                                    <option value="researcher">Researcher (Can create and run FL jobs)</option>
                                    <option value="data_custodian">Data Custodian (Can register datasets)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="action-btn" style={{ fontSize: '0.9rem', padding: '10px 24px' }}>Add to Team →</button>
                    </form>
                </div>
            )}

            <div className="content-card">
                {loading ? <div className="empty-state"><p>Loading…</p></div> : members.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>No team members yet. Invite researchers to collaborate.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead><tr>
                            <th>User</th><th>Email</th><th>Role</th><th>Joined</th>
                        </tr></thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.membership_id}>
                                    <td style={{ fontWeight: 600 }}>{m.username} {m.user_id === user.id && <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', marginLeft: 8 }}>You</span>}</td>
                                    <td>{m.email}</td>
                                    <td><span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{m.role.replace('_', ' ').toUpperCase()}</span></td>
                                    <td style={{ opacity: 0.6, fontSize: '0.82rem' }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
