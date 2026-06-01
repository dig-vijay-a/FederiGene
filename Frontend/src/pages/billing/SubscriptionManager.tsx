// @ts-nocheck
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function SubscriptionManager() {
    usePageTitle('Subscription Management');
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [status, setStatus] = useState<any>(null);
    const [tiers, setTiers] = useState({});
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    if (!user?.organization) {
        return (
            <div className="subscription-container">
                <div className="page-header">
                    <h1><span className="gradient-text">Enterprise Licensing</span></h1>
                    <p>Manage your organization's subscription tier and commercial features.</p>
                </div>
                <div className="content-card">
                    <div className="empty-state">
                        <div className="empty-icon">🏥</div>
                        <p>No organization registered yet.</p>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>You must register an organization before managing enterprise licenses.</p>
                    </div>
                </div>
            </div>
        );
    }

    const [checkoutTier, setCheckoutTier] = useState<any>(null);
    const [confirmAction, setConfirmAction] = useState<any>(null);
    
    useEffect(() => {
        // Fetch Subscriptions
        Promise.all([
            api.get('/license/status').catch(() => ({ data: null })),
            api.get('/license/tiers')
        ]).then(([statusRes, tiersRes]) => {
            setStatus(statusRes.data);
            setTiers(tiersRes.data);
        }).finally(() => setLoading(false));
    }, []);

    const loadRazorpaySDK = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const triggerRazorpay = async (itemKey) => {
        setUpgrading(true);
        try {
            // Load script
            const resSdk = await loadRazorpaySDK();
            if (!resSdk) {
                showToast("Razorpay SDK failed to load. Are you online?", 'error');
                setUpgrading(false);
                return;
            }

            // Create Order on Backend (Supports Tiers or FedCoin Packs)
            const orderRes = await api.post(`/license/create-razorpay-order?tier=${itemKey}&currency=INR`);
            const orderData = orderRes.data;

            if (orderData.error) {
                showToast("Server Error: " + orderData.error, 'error');
                setUpgrading(false);
                return;
            }

            if (!orderData.order_id) {
                // Free tier fallback
                processPurchase(itemKey);
                return;
            }

            // Initialize Razorpay Modal
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "FederiGene Marketplace",
                description: itemKey.endsWith('_fc') ? `Purchase FedCoin Pack` : `Upgrade to ${tiers[itemKey]?.name || itemKey}`,
                order_id: orderData.order_id,
                theme: { color: "#6B46C1" },
                handler: function (response) {
                    processPurchase(itemKey);
                },
                modal: {
                    ondismiss: function() {
                        setUpgrading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                showToast("Payment Failed: " + response.error.description, 'error');
                setUpgrading(false);
            });
            rzp.open();

        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.detail || "Failed to initialize payment gateway.", 'error');
            setUpgrading(false);
        }
    };

    const processPurchase = async (itemKey) => {
        setConfirmAction(null);
        try {
            let res;
            if (itemKey.endsWith('_fc')) {
                res = await api.post(`/license/finalize-fedcoin-purchase?pack_id=${itemKey}`);
                showToast(res.data.message, 'success');
            } else {
                res = await api.post(`/license/request-upgrade?tier=${itemKey}`);
                showToast(res.data.message, 'success');
            }
            
            // Refresh data
            const statusRes = await api.get('/license/status');
            setStatus(statusRes.data);
            if (refreshUser) refreshUser();
            setCheckoutTier(null);
        } catch (err) {
            showToast(err.response?.data?.detail || "Transaction failed", 'error');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) return <div className="empty-state">Loading subscription settings...</div>;

    return (
        <div className="subscription-container">
            <div className="page-header">
                <h1><span className="gradient-text">Enterprise Licensing</span></h1>
                <p>Manage your organization's subscription tier and commercial features.</p>
            </div>

            {status && (
                <div className="current-plan-card glass-card">
                    <div className="status-badge active">● Active Subscription</div>
                    <h2>{status.details.name} Plan</h2>
                    <p style={{ opacity: 0.7 }}>Organization: <b>{status.org_name}</b></p>
                    <div className="plan-stats">
                        <div className="plan-stat">
                            <span className="label">Valid Until</span>
                            <span className="value">{status.expires_at ? new Date(status.expires_at).toLocaleDateString() : 'Lifetime'}</span>
                        </div>
                        <div className="plan-stat">
                            <span className="label">Active Node Limit</span>
                            <span className="value">{status.details.max_jobs} Projects</span>
                        </div>
                    </div>
                </div>
            )}

            <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Available Tiers</h3>
            <div className="tier-grid">
                {Object.entries(tiers).map(([key, tier]) => {
                    const isCurrent = status?.current_tier === key;
                    const displayPrice = tier.price === 'Contact Sales' ? 'Custom' : tier.price;
                    
                    return (
                        <div key={key} className={`tier-card ${isCurrent ? 'current' : ''}`}>
                            {isCurrent && <div className="current-ribbon">Your Plan</div>}
                            <div className="tier-header">
                                <h4>{tier.name}</h4>
                                <div className="price">{displayPrice}</div>
                            </div>
                            <ul className="feature-list">
                                {tier.features.map((f, i) => (
                                    <li key={i}>
                                        <span className="check">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            {!isCurrent && user?.role === 'hospital_admin' && (
                                <button
                                    className="upgrade-btn"
                                    onClick={() => {
                                        if (key === 'institutional') {
                                            setConfirmAction({
                                                title: "Connect with Enterprise Sales?",
                                                message: "A request will be submitted and our sales team will receive an email notification.",
                                                onConfirm: () => processPurchase('institutional')
                                            });
                                        } else if (key === 'free') {
                                            setConfirmAction({
                                                title: "Downgrade to Free?",
                                                message: "Are you sure you want to cancel your commercial enterprise plan?",
                                                onConfirm: () => processPurchase('free')
                                            });
                                        }
                                        else setCheckoutTier(key);
                                    }}
                                >
                                    {key === 'institutional' ? 'Contact Sales' : (key === 'free' ? 'Downgrade to Free' : 'Upgrade Now')}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="marketplace-section" style={{ marginTop: '5rem' }}>
                <div className="section-header" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>FedCoin Marketplace <img src="/coin_3d.png" alt="FedCoin" style={{ width: '24px', height: '24px' }} /></h3>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '5px' }}>Purchase compute credits to fuel your federated learning orchestrations.</p>
                </div>
                
                <div className="fedcoin-grid">
                    {[
                        { id: 'starter_fc', name: 'Starter Pack', amount: 1000, price: '₹499', icon: '💎' },
                        { id: 'pro_fc', name: 'Professional Pack', amount: 5000, price: '₹1,999', icon: '💰', popular: true },
                        { id: 'inst_fc', name: 'Institutional Pack', amount: 25000, price: '₹8,999', icon: '🏛️' }
                    ].map(pack => (
                        <div key={pack.id} className={`fedcoin-card glass-card ${pack.popular ? 'popular' : ''}`}>
                            {pack.popular && <div className="popular-tag">MOST POPULAR</div>}
                            <div className="pack-icon">{pack.icon}</div>
                            <h4>{pack.name}</h4>
                            <div className="fc-amount">{pack.amount.toLocaleString()} FC</div>
                            <div className="fc-price">{pack.price}</div>
                            <button 
                                className="buy-fc-btn"
                                onClick={() => setCheckoutTier(pack.id)}
                            >
                                Purchase Pack
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Confirm Modal */}
            {confirmAction && (
                <div className="checkout-overlay">
                    <div className="glass-card checkout-modal" style={{ maxWidth: '400px' }}>
                        <div className="checkout-header">
                            <h3>{confirmAction.title}</h3>
                            <button className="close-btn" onClick={() => setConfirmAction(null)}>✕</button>
                        </div>
                        <div className="checkout-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                            <p style={{ opacity: 0.9, lineHeight: 1.5 }}>{confirmAction.message}</p>
                        </div>
                        <div className="checkout-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="auth-input" style={{ background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setConfirmAction(null)}>Cancel</button>
                            <button className="action-btn" onClick={confirmAction.onConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {checkoutTier && (() => {
                let itemData = null;
                if (checkoutTier.endsWith('_fc')) {
                    const packs = [
                        { id: 'starter_fc', name: 'Starter Pack', amount: 1000, price: '₹499' },
                        { id: 'pro_fc', name: 'Professional Pack', amount: 5000, price: '₹1,999' },
                        { id: 'inst_fc', name: 'Institutional Pack', amount: 25000, price: '₹8,999' }
                    ];
                    itemData = packs.find(p => p.id === checkoutTier);
                } else {
                    itemData = tiers[checkoutTier];
                }
                if (!itemData) return null;

                return (
                    <div className="checkout-overlay">
                        <div className="glass-card checkout-modal" style={{ maxWidth: '500px' }}>
                            <div className="checkout-header">
                                <h3>Ready for Checkout</h3>
                                <button className="close-btn" type="button" onClick={() => !upgrading && setCheckoutTier(null)}>✕</button>
                            </div>
                            <div className="checkout-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" style={{ height: '30px', marginBottom: '1.5rem' }} />
                                <div className="order-summary" style={{ borderTop: 'none', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{itemData.name} {checkoutTier.endsWith('_fc') ? '' : 'Enterprise Edition'}</span>
                                    <strong style={{ fontSize: '2rem', color: 'white' }}>{itemData.price}</strong>
                                </div>
                                <p style={{ opacity: 0.8, marginTop: '2rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    You will be redirected to our secure Razorpay gateway to complete your transaction globally.
                                </p>
                            </div>
                            <div className="checkout-footer">
                                <button onClick={() => triggerRazorpay(checkoutTier)} className="action-btn" style={{ width: '100%', padding: '15px' }} disabled={upgrading}>
                                    {upgrading ? 'Connecting to Gateway...' : `Proceed to Secure Checkout`}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                .subscription-container { max-width: 1200px; margin: 0 auto; padding-bottom: 4rem; }
                .current-plan-card { padding: 2rem; margin-bottom: 2rem; border-left: 6px solid #8b5cf6; position: relative; }
                .status-badge { position: absolute; top: 1.5rem; right: 2rem; font-size: 0.8rem; font-weight: 700; color: #22c55e; background: rgba(34,197,94,0.1); padding: 4px 12px; border-radius: 20px; }
                .plan-stats { display: flex; gap: 4rem; margin-top: 2rem; }
                .plan-stat { display: flex; flex-direction: column; }
                .plan-stat .label { font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; margin-bottom: 4px; }
                .plan-stat .value { font-size: 1.2rem; font-weight: 700; color: var(--accent-color); }

                .tier-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
                .tier-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; position: relative; transition: transform 0.3s; }
                .tier-card.current { border-color: #8b5cf6; background: rgba(139,92,246,0.03); transform: scale(1.02); }
                .current-ribbon { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #8b5cf6; color: white; padding: 4px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
                
                .tier-header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .tier-header h4 { margin: 0; font-size: 1.1rem; color: var(--text-color); }
                .price { font-size: 2rem; font-weight: 800; color: #8b5cf6; margin-top: 4px; }
                
                .feature-list { list-style: none; padding: 0; margin: 0; flex: 1; }
                .feature-list li { font-size: 0.85rem; margin-bottom: 12px; display: flex; gap: 10px; opacity: 0.9; }
                .check { color: #22c55e; font-weight: 700; }
                
                .upgrade-btn { width: 100%; margin-top: 1.5rem; padding: 12px; border-radius: 8px; border: 1px solid #8b5cf6; background: transparent; color: #8b5cf6; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .upgrade-btn:hover { background: #8b5cf6; color: white; }
                .upgrade-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .fedcoin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
                .fedcoin-card { background: var(--card-bg); padding: 2.5rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,215,0,0.1); transition: all 0.3s ease; border-radius: 12px; position: relative; overflow: hidden; }
                .fedcoin-card:hover { transform: translateY(-5px); border-color: rgba(255,215,0,0.3); box-shadow: 0 10px 40px rgba(255,215,0,0.1); }
                .fedcoin-card.popular { border-color: rgba(255,215,0,0.5); background: linear-gradient(135deg, rgba(255,215,0,0.05) 0%, transparent 100%); }
                .popular-tag { position: absolute; top: 12px; right: 12px; background: #eab308; color: #000; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 4px; }
                
                .pack-icon { font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(255,215,0,0.3)); }
                .fedcoin-card h4 { margin: 0; font-size: 1.2rem; color: #ffffff; }
                .fc-amount { font-size: 2.5rem; font-weight: 800; color: #eab308; margin: 1rem 0; }
                .fc-price { font-size: 1.1rem; font-weight: 600; opacity: 0.8; margin-bottom: 2rem; }
                
                .buy-fc-btn { width: 100%; padding: 12px; border-radius: 8px; background: #eab308; color: #000; border: none; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .buy-fc-btn:hover { background: #facc15; transform: scale(1.02); }

                .checkout-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 999; animation: fadeIn 0.3s ease; }
                .checkout-modal { width: 90%; max-width: 450px; padding: 0; overflow: hidden; animation: slideUp 0.3s ease; border: 1px solid rgba(255,255,255,0.1); }
                .checkout-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); }
                .checkout-header h3 { margin: 0; font-size: 1.25rem; }
                .close-btn { background: transparent; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.6; transition: 0.2s; }
                .close-btn:hover { opacity: 1; }
                .checkout-body { padding: 1.5rem; }
                .order-summary { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(139,92,246,0.1); border-radius: 8px; border: 1px solid rgba(139,92,246,0.3); }
                .checkout-footer { padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
