import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function GenomicPassport() {
    const { user } = useAuth();
    const [status, setStatus] = useState("Loading...");
    const [didString, setDidString] = useState("");
    const [showExplorer, setShowExplorer] = useState(false);

    useEffect(() => {
        const fetchPassport = () => {
            api.get('/patient/dashboard').then(res => {
                setStatus(res.data.passport_status);
                setDidString(res.data.did_string);
            }).catch(err => {
                console.error("Error loading passport status", err);
            });
        };

        fetchPassport();
        const interval = setInterval(fetchPassport, 5000); // Live rendering every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginTop: '1rem', textAlign: 'center' }}>
                <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Genomic Passport</h1>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Your Verifiable Sovereign Identity (Web3)</p>
            </header>

            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', border: '2px solid var(--accent-color)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧬</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>OMEGA PASSPORT #{user?.id || '0000'}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', opacity: 0.5, wordBreak: 'break-all', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    {didString || `did:fedegene:pt_${user?.id}_0x...`}
                </div>
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem' }}>Security Attributes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Encryption</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Kyber-1024</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Privacy Level</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Atomic (L3)</div>
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1rem' }}>Data Lineage</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Sequence Verified</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Status: {status}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Ownership Confirmed</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Decentralized ID (DID) Linked</div>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                className="action-btn" 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'white' }}
                onClick={() => setShowExplorer(true)}
            >
                View on Blockchain Explorer
            </button>

            {/* Blockchain Explorer Modal */}
            {showExplorer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', height: '80vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1rem', color: '#8b5cf6' }}>FederiChain Explorer</h2>
                        <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '1.5rem' }}>Live distributed ledger sync</p>
                        
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Identity DID</div>
                            <div style={{ fontSize: '0.8rem', wordBreak: 'break-all', fontFamily: 'monospace', color: '#fbbf24' }}>
                                {didString || `did:fedegene:pt_${user?.id}_0x...`}
                            </div>
                        </div>

                        <h4 style={{ margin: '1rem 0' }}>Identity Blocks</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                                <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Block #849301</div>
                                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Tx: 0x...a8f4c</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>Smart Contract Linked</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                                <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Block #849122</div>
                                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Tx: 0x...1b9e2</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>Genome Sequence Verified</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                                <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Block #849005</div>
                                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Tx: 0x...3c7d9</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '4px' }}>DID Created</div>
                            </div>
                        </div>

                        <button className="action-btn" style={{ marginTop: '2rem' }} onClick={() => setShowExplorer(false)}>Close Explorer</button>
                    </div>
                </div>
            )}
        </div>
    );
}
