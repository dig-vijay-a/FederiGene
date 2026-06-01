import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import './LandingPage.css';

const LandingPage = () => {
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo-container">
                    <img src="/logo.png" alt="FederiGene Logo" className="nav-logo-img" />
                    <div className="nav-logo">FederiGene</div>
                </div>
                <div className="nav-links">
                    <button className="nav-link" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', fontSize: '1.2rem' }} aria-label="Toggle Theme">
                        {theme === 'dark' ? <img src="/sun_3d.png" alt="Light Mode" style={{ width: '24px', height: '24px' }} /> : <img src="/crescent_moon_3d.png" alt="Dark Mode" style={{ width: '24px', height: '24px' }} />}
                    </button>
                    <a href="#about" className="nav-link">About</a>
                    <a href="#how-it-works" className="nav-link">Workflow</a>
                    <a href="#features" className="nav-link">Security</a>
                    <a href="#downloads" className="nav-link">Apps</a>
                    <Link to="/login" className="nav-link login-link">Login</Link>
                    <Link to="/register" className="action-btn nav-cta">Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1><span className="gradient-text">Own Your Biology.</span><br />Heal Humanity.</h1>
                    <p className="hero-subtitle">
                        FederiGene is a privacy-first federated genomics platform. 
                        We enable global medical research without ever moving raw patient data, 
                        giving sovereignty back to patients and intelligence back to science.
                    </p>
                    <div className="hero-ctas">
                        <Link to="/register" className="action-btn">Register</Link>
                        <Link to="/login" className="action-btn secondary-btn">Login</Link>
                    </div>
                </div>
            </section>

            {/* Introduction Section */}
            <section id="about" className="landing-section">
                <div className="mission-container">
                    <div className="mission-text">
                        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>The Mission</h2>
                        <p className="description-text">
                            In a world where genetic data is often locked in silos or sold without consent, 
                            FederiGene provides a decentralized alternative. By using <b>Federated Learning</b>, 
                            hospitals can train AI models collaboratively while keeping data strictly on-premise. 
                        </p>
                        <p className="description-text">
                            Our platform integrates Web3 technology to ensure patients are rewarded fairly for 
                            their contribution through the <b>FedCoin</b> ecosystem. We are building the 
                            operating system for the future of decentralized medicine.
                        </p>
                    </div>
                    <div className="mission-stats">
                        <div className="stat-box">
                            <span className="stat-value">100%</span>
                            <span className="stat-label">Data Privacy</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-value">92%+</span>
                            <span className="stat-label">Model Accuracy</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="landing-section dark-alt">
                <h2 className="section-title">Decentralized Intelligence Workflow</h2>
                <div className="workflow-steps">
                    <div className="step">
                        <div className="step-num">01</div>
                        <h3>Sovereign Identity</h3>
                        <p>Patients mint a Genomic Passport NFT, creating a secure link between their DNA and their DID.</p>
                    </div>
                    <div className="step">
                        <div className="step-num">02</div>
                        <h3>Local Training</h3>
                        <p>AI models travel to the hospital nodes. Training happens on-site. Raw data never leaves the firewall.</p>
                    </div>
                    <div className="step">
                        <div className="step-num">03</div>
                        <h3>Global Consensus</h3>
                        <p>Encrypted model weights are aggregated globally to create a "Universal Intelligence" for rare diseases.</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="landing-section" style={{ background: 'rgba(var(--accent-rgb), 0.02)' }}>
                <h2 className="section-title">The 8 Pillars of Security</h2>
                <div className="features-grid">
                    <FeatureCard 
                        icon="🔒" 
                        title="Atomic Privacy" 
                        desc="Molecular-level encryption ensuring data remains unreadable even if physically accessed." 
                    />
                    <FeatureCard 
                        icon="🛡️" 
                        title="Quantum Shield" 
                        desc="Post-quantum cryptography protecting your genomic history against future compute threats." 
                    />
                    <FeatureCard 
                        icon="🔗" 
                        title="Trust Explorer" 
                        desc="Blockchain-backed immutable logs ensuring every research job is verified and consented." 
                    />
                    <FeatureCard 
                        icon="⚡" 
                        title="FedAsync Engine" 
                        desc="Real-time distributed training that handles slow connections across global hospital nodes." 
                    />
                    <FeatureCard 
                        icon="✅" 
                        title="System Integrity" 
                        desc="Continuous hashing of system files and training scripts to prevent unauthorized logic changes." 
                    />
                    <FeatureCard 
                        icon="🔑" 
                        title="Key Management" 
                        desc="Enterprise-grade AES-256 key rotation and vaulting to protect multi-institutional assets." 
                    />
                    <FeatureCard 
                        icon="🛂" 
                        title="Access Control" 
                        desc="Granular role-based permissions ensuring researchers only see what they are authorized to see." 
                    />
                    <FeatureCard 
                        icon="📑" 
                        title="Audit Logs" 
                        desc="Immutable 'Flight Recorder' tracking every API call and training round for complete accountability." 
                    />
                </div>
            </section>

            {/* Downloads Section */}
            <section id="downloads" className="landing-section">
                <h2 className="section-title">Get Started</h2>
                <div className="downloads-container">
                    <div className="download-box">
                        <div className="box-header">
                            <span className="feature-icon">📱</span>
                            <h3>Patient Companion</h3>
                        </div>
                        <p>Manage your Genomic Passport, grant research consent, and track your FedCoin dividends.</p>
                        <button className="download-link-btn" style={{ marginTop: '2.5rem' }} onClick={() => {
                            showToast("Downloading PatientApp-v29.apk...", "info");
                            fetch('/PatientApp-v29.apk')
                                .then(response => response.blob())
                                .then(blob => {
                                    const url = window.URL.createObjectURL(new Blob([blob]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = 'PatientApp-v29.apk';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                })
                                .catch(() => showToast("Failed to download APK.", "error"));
                        }}>Download Android (.apk)</button>
                    </div>
                    <div className="download-box">
                        <div className="box-header">
                            <span className="feature-icon">🏗️</span>
                            <h3>FederiGene Node App</h3>
                        </div>
                        <p>Desktop application for hospital administrators to manage local training nodes and datasets.</p>
                        <div className="download-options">
                            <button className="download-link-btn" onClick={() => window.open('/download-windows-app', '_blank')}>Download .exe (Windows)</button>
                            <button className="download-link-btn" disabled>Download .dmg (macOS)</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Developer Section */}
            <section className="landing-section">
                <div className="developer-profile-card">
                    <div className="dev-visual">
                        <div className="dev-initials">D</div>
                        <div className="dev-bio-badge">Bioinformatics</div>
                    </div>
                    <div className="dev-details">
                        <span className="dev-label">Lead Developer & Architect</span>
                        <h3>Digvijay</h3>
                        <p className="dev-bio">
                            A passionate <b>Engineering Student</b> from the <b>Bioinformatics Department</b>. 
                            Digvijay is dedicated to merging the worlds of computer science and biological 
                            discovery to create tools that empower patients and accelerate medical breakthroughs.
                        </p>
                        <div className="dev-socials">
                            <a href="https://github.com/dig-vijay-a/" target="_blank" rel="noopener noreferrer" className="social-tag">GitHub</a>
                            <a href="https://www.linkedin.com/in/dig-vijay/" target="_blank" rel="noopener noreferrer" className="social-tag">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 FederiGene Platform. All rights reserved. Sovereign Data. Collective Intelligence. Universal Cures.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="feature-card">
        <span className="feature-icon">{icon}</span>
        <div className="feature-content">
            <h3>{title}</h3>
            <p>{desc}</p>
        </div>
    </div>
);

export default LandingPage;
