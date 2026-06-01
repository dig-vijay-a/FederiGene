// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function SalesLeads() {
    usePageTitle('Enterprise Sales Leads');
    const { showToast } = useToast();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<any>(null);
    const [notesModal, setNotesModal] = useState<any>(null);
    const [noteText, setNoteText] = useState('');
    const [approveModal, setApproveModal] = useState<any>(null);
    const [rejectModal, setRejectModal] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [invoiceModal, setInvoiceModal] = useState<any>(null);
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [invoiceDesc, setInvoiceDesc] = useState('');
    const [successMsg, setSuccessMsg] = useState<any>(null);

    const fetchLeads = () => {
        api.get('/license/sales-leads')
            .then(res => setLeads(res.data))
            .catch(err => console.error("Failed to load sales leads", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLeads(); }, []);

    const handleRespond = (leadId, status, notes = null) => {
        setActionLoading(leadId);
        api.post(`/license/sales-leads/${leadId}/respond`, { status, admin_notes: notes })
            .then(() => {
                fetchLeads();
                setNotesModal(null);
                setRejectModal(null);
                setNoteText('');
                setRejectReason('');
                if (status === 'rejected') setSuccessMsg('Lead rejected. A notification email has been sent to the requester.');
            })
            .catch(err => showToast(err.response?.data?.detail || "Action failed", 'error'))
            .finally(() => setActionLoading(null));
    };

    const handleApprove = (leadId) => {
        setApproveModal(null);
        setActionLoading(leadId);
        api.post(`/license/sales-leads/${leadId}/approve`)
            .then(res => {
                setSuccessMsg(res.data.message);
                fetchLeads();
            })
            .catch(err => setSuccessMsg(err.response?.data?.detail || "Approval failed"))
            .finally(() => setActionLoading(null));
    };

    const handleGenerateInvoice = (leadId, amount, description) => {
        setActionLoading(leadId);
        api.post(`/license/sales-leads/${leadId}/invoice`, { amount: parseFloat(amount), description })
            .then(res => {
                setSuccessMsg(`Invoice for ₹${amount} has been generated and emailed to the customer.`);
                setInvoiceModal(null);
                fetchLeads();
            })
            .catch(err => showToast(err.response?.data?.detail || "Invoicing failed", 'error'))
            .finally(() => setActionLoading(null));
    };

    const statusColor = (status) => {
        switch (status) {
            case 'new': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
            case 'contacted': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308' };
            case 'approved': return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
            case 'rejected': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
            default: return { bg: 'rgba(255,255,255,0.05)', color: '#888' };
        }
    };

    if (loading) return <div className="loading-state">Loading Sales Pipeline...</div>;

    return (
        <div>
            <div className="page-header">
                <h1><span className="emoji">💼</span><span className="gradient-text"> Enterprise Sales Pipeline</span></h1>
                <p>Manage inbound Institutional Hub upgrade requests. Review, contact, and approve enterprise leads.</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Leads</div>
                    <div className="stat-value">{leads.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">New (Unreviewed)</div>
                    <div className="stat-value" style={{ color: '#3b82f6' }}>{leads.filter(l => l.status === 'new').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Contacted</div>
                    <div className="stat-value" style={{ color: '#eab308' }}>{leads.filter(l => l.status === 'contacted').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Approved</div>
                    <div className="stat-value" style={{ color: '#22c55e' }}>{leads.filter(l => l.status === 'approved').length}</div>
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="content-card" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                    <p>No enterprise inquiries yet. Leads appear here when users click "Contact Sales" on the Billing page.</p>
                </div>
            ) : (
                <div className="content-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Organization</th>
                                <th>Requester</th>
                                <th>Email</th>
                                <th>Tier</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => {
                                const sc = statusColor(lead.status);
                                const isActive = lead.status === 'new' || lead.status === 'contacted';
                                return (
                                    <tr key={lead.id}>
                                        <td style={{ fontWeight: 600 }}>{lead.org_name}</td>
                                        <td>{lead.requester_name}</td>
                                        <td style={{ fontSize: '0.85rem', opacity: 0.8 }}>{lead.requester_email}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{lead.requested_tier}</td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                background: sc.bg, color: sc.color, textTransform: 'capitalize'
                                            }}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {lead.admin_notes || '—'}
                                            {lead.custom_price && (
                                                <div style={{ color: '#22c55e', fontWeight: 600, marginTop: '4px' }}>
                                                    Invoice: ₹{lead.custom_price.toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {isActive && (
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {lead.status === 'new' && (
                                                        <button
                                                            className="action-btn secondary"
                                                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                            disabled={actionLoading === lead.id}
                                                            onClick={() => { setNotesModal(lead.id); setNoteText(''); }}
                                                        >
                                                            📞 Contact
                                                        </button>
                                                    )}
                                                    <button
                                                        className="action-btn"
                                                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#6B46C1' }}
                                                        disabled={actionLoading === lead.id}
                                                        onClick={() => { setInvoiceModal(lead); setInvoiceAmount(''); setInvoiceDesc(''); }}
                                                    >
                                                        📜 Invoice
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#22c55e' }}
                                                        disabled={actionLoading === lead.id}
                                                        onClick={() => setApproveModal(lead)}
                                                    >
                                                        ✅ Approve
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#ef4444' }}
                                                        disabled={actionLoading === lead.id}
                                                        onClick={() => { setRejectModal(lead); setRejectReason(''); }}
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </div>
                                            )}
                                            {lead.status === 'approved' && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓ Upgraded</span>}
                                            {lead.status === 'rejected' && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>✕ Declined</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invoice Generation Modal */}
            {invoiceModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '450px', padding: '2rem' }}>
                        <h3 style={{ marginTop: 0, color: '#6B46C1' }}>📜 Generate Custom Invoice</h3>
                        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Specify the negotiated amount for <strong>{invoiceModal.org_name}</strong>. An email with a payment link will be sent.</p>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Amount (INR)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={invoiceAmount}
                                onChange={e => setInvoiceAmount((e.target as any).value)}
                                placeholder="50000"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Description (Internal)</label>
                            <textarea
                                className="form-input"
                                rows={2}
                                value={invoiceDesc}
                                onChange={e => setInvoiceDesc((e.target as any).value)}
                                placeholder="Negotiated for 50 users + 24/7 support..."
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => setInvoiceModal(null)}>Cancel</button>
                            <button 
                                className="action-btn" 
                                style={{ flex: 1, background: '#6B46C1' }} 
                                disabled={!invoiceAmount || actionLoading}
                                onClick={() => handleGenerateInvoice(invoiceModal.id, invoiceAmount, invoiceDesc)}
                            >
                                {actionLoading ? 'Sending...' : 'Send Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal for "Mark Contacted" */}
            {notesModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '450px', padding: '2rem' }}>
                        <h3 style={{ marginTop: 0 }}>Mark Lead as Contacted</h3>
                        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Add notes about your interaction (call, email, meeting, etc.)</p>
                        <textarea
                            className="form-input"
                            rows={4}
                            value={noteText}
                            onChange={e => setNoteText((e.target as any).value)}
                            placeholder="e.g. Called on 31 March — discussed TEE custom integration requirements..."
                            style={{ width: '100%', marginBottom: '1rem', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => setNotesModal(null)}>Cancel</button>
                            <button className="action-btn" style={{ flex: 1 }} onClick={() => handleRespond(notesModal, 'contacted', noteText)}>
                                Save & Mark Contacted
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {approveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '450px', padding: '2rem', animation: 'slideUp 0.3s ease' }}>
                        <h3 style={{ marginTop: 0, color: '#22c55e' }}>✅ Approve Enterprise Upgrade</h3>
                        <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
                            This will upgrade <strong>{approveModal.org_name}</strong> to the <strong>Institutional Hub</strong> tier and send a confirmation email to <strong>{approveModal.requester_email}</strong>.
                        </p>
                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            🔑 A license key will be generated and included in the email.
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => setApproveModal(null)}>Cancel</button>
                            <button className="action-btn" style={{ flex: 1, background: '#22c55e' }} onClick={() => handleApprove(approveModal.id)}>
                                Approve & Upgrade
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Modal */}
            {rejectModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '450px', padding: '2rem', animation: 'slideUp 0.3s ease' }}>
                        <h3 style={{ marginTop: 0, color: '#ef4444' }}>✕ Reject Enterprise Inquiry</h3>
                        <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
                            Reject the upgrade request from <strong>{rejectModal.org_name}</strong>? A notification email will be sent to <strong>{rejectModal.requester_email}</strong>.
                        </p>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={rejectReason}
                            onChange={e => setRejectReason((e.target as any).value)}
                            placeholder="Optional: reason for declining (included in the email)..."
                            style={{ width: '100%', marginBottom: '1rem', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="action-btn secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>Cancel</button>
                            <button className="action-btn" style={{ flex: 1, background: '#ef4444' }} onClick={() => handleRespond(rejectModal.id, 'rejected', rejectReason || 'Declined by admin')}>
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success / Result Modal */}
            {successMsg && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
                }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📨</div>
                        <p style={{ lineHeight: 1.6, opacity: 0.9 }}>{successMsg}</p>
                        <button className="action-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setSuccessMsg(null)}>Done</button>
                    </div>
                </div>
            )}

            <style>{`
                .loading-state { height: 300px; display: flex; align-items: center; justify-content: center; opacity: 0.6; }
            `}</style>
        </div>
    );
}
