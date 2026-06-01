import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function OrgProfile() {
    const { user } = useAuth();
    usePageTitle('Org Profile');
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);
    const [form, setForm] = useState({ 
        name: '', org_type: 'hospital', license_number: '', address: '', country: '', 
        contact_email: '', contact_phone: '',
        tax_id: '', website: '', representative_name: '', representative_role: '', legal_document_url: ''
    });
    const [error, setError] = useState<any>(null);
    const [success, setSuccess] = useState<any>(null);

    useEffect(() => {
        api.get('/platform/orgs')
            .then(res => setOrgs(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        try {
            const res = await api.post('/platform/orgs/register', { ...form, contact_email: form.contact_email || user?.email });
            setSuccess(res.data.message);
            setShowRegister(false);
            // Refresh
            const orgsRes = await api.get('/platform/orgs');
            setOrgs(orgsRes.data);
        } catch (err) { setError(err.response?.data?.detail || 'Registration failed'); }
    };

    const hasOrg = orgs.length > 0;

    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Organization </span><span className="emoji">🏥</span></h1>
                <p>{hasOrg ? 'Your organization profile and details' : 'Register your hospital or lab to start collaborating'}</p>
            </div>

            {success && <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid rgba(34,197,94,0.2)' }}>{success}</div>}
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            {hasOrg ? (
                orgs.map(org => (
                    <div key={org.id} className="content-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem' }}>{org.name}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                                    {org.org_type.replace('_', ' ')} • {org.country || 'No location set'} • {org.contact_email}
                                </p>
                            </div>
                            <span className={`badge badge-${org.status}`}>{org.status}</span>
                        </div>
                        {org.status === 'pending' && (
                            <p style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.6 }}>
                                ⏳ Awaiting platform administrator approval. You'll be notified once approved.
                            </p>
                        )}
                    </div>
                ))
            ) : !showRegister ? (
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon">🏥</div>
                        <p>No organization registered yet.</p>
                        <button className="action-btn" onClick={() => setShowRegister(true)} style={{ marginTop: '1rem', fontSize: '0.9rem', padding: '10px 24px' }}>Register Organization</button>
                    </div>
                </div>
            ) : (
                <div className="content-card">
                    <h3>Register Your Organization</h3>
                    <form onSubmit={handleRegister}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Organization Name</label>
                                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: (e.target as any).value }))} placeholder="e.g., Stanford Medical Center" />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select className="form-input" value={form.org_type} onChange={e => setForm(f => ({ ...f, org_type: (e.target as any).value }))}>
                                    <option value="hospital">Hospital</option>
                                    <option value="lab">Research Lab</option>
                                    <option value="research_institute">Research Institute</option>
                                    <option value="university">University</option>
                                    <option value="pharma">Pharmaceutical</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>License Number</label>
                                <input type="text" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: (e.target as any).value }))} placeholder="Optional" />
                            </div>
                            <div className="form-group">
                                <label>Country</label>
                                <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: (e.target as any).value }))} placeholder="e.g., United States" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: (e.target as any).value }))} placeholder="Full address…"></textarea>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Email</label>
                                <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: (e.target as any).value }))} placeholder={user?.email || 'admin@hospital.com'} />
                            </div>
                            <div className="form-group">
                                <label>Contact Phone</label>
                                <input type="tel" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: (e.target as any).value }))} placeholder="Optional" />
                            </div>
                        </div>

                        <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--card-border)' }}>Verification Details</h4>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tax ID / EIN</label>
                                <input type="text" value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: (e.target as any).value }))} placeholder="Required for commercial payouts" />
                            </div>
                            <div className="form-group">
                                <label>Official Website URL</label>
                                <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: (e.target as any).value }))} placeholder="https://..." />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Representative Name</label>
                                <input type="text" value={form.representative_name} onChange={e => setForm(f => ({ ...f, representative_name: (e.target as any).value }))} placeholder="Authorized Signatory" />
                            </div>
                            <div className="form-group">
                                <label>Representative Role</label>
                                <input type="text" value={form.representative_role} onChange={e => setForm(f => ({ ...f, representative_role: (e.target as any).value }))} placeholder="e.g., Chief Information Officer" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Verification Document URL</label>
                            <input type="text" value={form.legal_document_url} onChange={e => setForm(f => ({ ...f, legal_document_url: (e.target as any).value }))} placeholder="Link to institutional verification document (e.g. cloud storage URL)" />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" className="action-btn" style={{ fontSize: '0.9rem', padding: '10px 24px' }}>Submit for Approval →</button>
                            <button type="button" className="action-btn" onClick={() => setShowRegister(false)} style={{ fontSize: '0.9rem', padding: '10px 24px', background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-color)' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
