// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function InvoicePayment() {
    usePageTitle('Enterprise Invoice Payment');
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        fetchInvoice();
    }, [invoiceId]);

    const fetchInvoice = () => {
        setLoading(true);
        api.get(`/license/public/invoice/${invoiceId}`)
            .then(res => {
                setInvoice(res.data);
                if (res.data.status === 'approved') {
                    setSuccess(true);
                }
            })
            .catch(err => {
                setError(err.response?.data?.detail || "Invoice not found or expired.");
            })
            .finally(() => setLoading(false));
    };

    const loadRazorpaySDK = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setProcessing(true);
        try {
            const sdkLoaded = await loadRazorpaySDK();
            if (!sdkLoaded) {
                showToast("Payment gateway failed to load. Please check your connection.", 'error');
                setProcessing(false);
                return;
            }

            // Create Order
            const orderRes = await api.post(`/license/public/invoice/${invoiceId}/checkout`);
            const orderData = orderRes.data;

            if (orderData.error) {
                showToast("Gateway Error: " + orderData.error, 'error');
                setProcessing(false);
                return;
            }

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "FederiGene Enterprise",
                description: `Invoice for ${invoice.org_name}`,
                order_id: orderData.order_id,
                theme: { color: "#6B46C1" },
                handler: async function (response) {
                    await finalizePayment();
                },
                modal: {
                    ondismiss: function() {
                        setProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                showToast("Payment Failed: " + response.error.description, 'error');
                setProcessing(false);
            });
            rzp.open();

        } catch (err) {
            showToast(err.response?.data?.detail || "Payment initialization failed.", 'error');
            setProcessing(false);
        }
    };

    const finalizePayment = async () => {
        try {
            const res = await api.post(`/license/public/invoice/${invoiceId}/finalize`);
            setSuccess(true);
            setProcessing(false);
        } catch (err) {
            showToast("Verification failed, but payment might have been successful. Please contact support.", 'warning');
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="payment-page-container">
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', opacity: 0.7 }}>Retrieving your invoice...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="payment-page-container">
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ color: '#ef4444' }}>Invalid Invoice</h2>
                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>{error}</p>
                <button className="action-btn secondary" onClick={() => navigate('/login')}>Return to Login</button>
            </div>
        </div>
    );

    if (success) return (
        <div className="payment-page-container">
            <div className="glass-card success-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div className="success-icon">✓</div>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Payment Successful!</h2>
                <p style={{ opacity: 0.9, fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                    Thank you! Your organization <strong>{invoice.org_name}</strong> has been upgraded to the <strong>Institutional Hub</strong>.
                    <br />A confirmation email with your enterprise license key has been sent.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="action-btn" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="payment-page-container">
            <div className="invoice-layout">
                <div className="invoice-details glass-card">
                    <div className="brand-header">
                        <span className="logo-text">FederiGene</span>
                        <span className="badge">Enterprise Invoice</span>
                    </div>
                    
                    <div className="invoice-header">
                        <h1><span className="gradient-text">Secure Checkout</span></h1>
                        <p>Complete your upgrade to Institutional Hub</p>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Organization</label>
                            <div className="value">{invoice.org_name}</div>
                        </div>
                        <div className="detail-item">
                            <label>Requested By</label>
                            <div className="value">{invoice.requester}</div>
                        </div>
                        <div className="detail-item">
                            <label>Selected Tier</label>
                            <div className="value" style={{ textTransform: 'capitalize' }}>{invoice.tier}</div>
                        </div>
                    </div>

                    <div className="order-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-row">
                            <span>Institutional Hub (Annual)</span>
                            <span>₹{invoice.amount?.toLocaleString()}</span>
                        </div>
                        <div className="summary-total">
                            <span>Amount Due</span>
                            <span>₹{invoice.amount?.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="payment-actions">
                        <button 
                            className="payment-btn" 
                            onClick={handlePayment}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Pay with Razorpay'}
                        </button>
                        <p className="secure-text">🔒 Secured by Razorpay India. All major cards, UPI, and wallets accepted.</p>
                    </div>
                </div>

                <div className="perks-panel glass-card">
                    <h3>Enterprise Perks</h3>
                    <ul className="perk-list">
                        <li>
                            <span className="icon">🚀</span>
                            <div>
                                <strong>Unlimited Projects</strong>
                                <p>Scale your federated learning without caps.</p>
                            </div>
                        </li>
                        <li>
                            <span className="icon">🛡️</span>
                            <div>
                                <strong>Custom TEE Integration</strong>
                                <p>Hardware-level security for your datasets.</p>
                            </div>
                        </li>
                        <li>
                            <span className="icon">🤝</span>
                            <div>
                                <strong>24/7 Priority Support</strong>
                                <p>Dedicated solutions architect for your team.</p>
                            </div>
                        </li>
                        <li>
                            <span className="icon">📄</span>
                            <div>
                                <strong>Compliance Export</strong>
                                <p>SOC2 and HIPAA ready reporting tools.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <style>{`
                .payment-page-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    color: white;
                }
                .invoice-layout {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 2rem;
                    width: 100%;
                    max-width: 1100px;
                }
                .brand-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .logo-text { font-size: 1.5rem; font-weight: 800; letter-spacing: -1px; background: linear-gradient(to right, #fff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .badge { background: rgba(107, 70, 193, 0.2); color: #a78bfa; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(167, 139, 250, 0.3); }
                
                .invoice-header h1 { margin: 0; font-size: 2.2rem; }
                .invoice-header p { opacity: 0.7; margin: 4px 0 2rem 0; }

                .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .detail-item label { display: block; font-size: 0.75rem; opacity: 0.5; text-transform: uppercase; margin-bottom: 4px; }
                .detail-item .value { font-weight: 600; font-size: 1.1rem; }

                .order-summary { background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 12px; margin-bottom: 2.5rem; }
                .order-summary h3 { margin-top: 0; font-size: 1rem; opacity: 0.8; margin-bottom: 1rem; }
                .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; opacity: 0.9; }
                .summary-total { display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 1.3rem; font-weight: 700; color: #a78bfa; }

                .payment-btn { 
                    width: 100%; 
                    background: #6B46C1; 
                    color: white; 
                    border: none; 
                    padding: 1.2rem; 
                    border-radius: 12px; 
                    font-size: 1.1rem; 
                    font-weight: 700; 
                    cursor: pointer; 
                    transition: all 0.3s;
                    box-shadow: 0 10px 25px rgba(107, 70, 193, 0.4);
                }
                .payment-btn:hover:not(:disabled) { background: #7c52db; transform: translateY(-2px); }
                .payment-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .secure-text { text-align: center; font-size: 0.75rem; opacity: 0.5; margin-top: 1rem; }

                .perks-panel h3 { margin-top: 0; margin-bottom: 1.5rem; }
                .perk-list { list-style: none; padding: 0; margin: 0; }
                .perk-list li { display: flex; gap: 1.2rem; margin-bottom: 1.8rem; }
                .perk-list .icon { font-size: 1.5rem; padding-top: 4px; }
                .perk-list strong { display: block; font-size: 1rem; margin-bottom: 4px; color: #a78bfa; }
                .perk-list p { margin: 0; font-size: 0.85rem; opacity: 0.7; line-height: 1.5; }

                .success-icon { 
                    width: 80px; height: 80px; background: #22c55e; color: white; border-radius: 50%; 
                    display: flex; align-items: center; justify-content: center; font-size: 3rem; 
                    margin: 0 auto 2rem auto; box-shadow: 0 0 40px rgba(34, 197, 94, 0.4);
                }

                @media (max-width: 900px) {
                    .invoice-layout { grid-template-columns: 1fr; }
                }

                .spinner {
                    width: 50px; height: 50px; border: 5px solid rgba(167, 139, 250, 0.1); border-top-color: #a78bfa;
                    border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
