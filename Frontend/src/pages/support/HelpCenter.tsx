import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';

export default function HelpCenter() {
    usePageTitle('Help Center');
    const { user } = useAuth();
    const { showToast } = useToast();

    const isInstitutional = user?.organization?.subscription_tier === 'institutional';

    const handleDownload = () => {
        if (isInstitutional) {
            // Actual file download logic
            const link = document.createElement('a');
            link.href = '/federigene_whitepaper.pdf';
            link.download = 'FederiGene_Whitepaper.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("🚀 Access Granted: FederiGene Whitepaper Download started.", 'success');
        } else {
            showToast("🔒 Restricted Access: The Technical Whitepaper is for Institutional Hub members only.", 'error');
        }
    };

    const sections = [
        {
            title: "🌍 Platform Governance",
            content: "FederiGene operates as a decentralized autonomous entity. Governance is shared between Hospital Nodes, Research Institutes, and the Eternal Guardian AI. All structural changes are voted upon via the Global Sovereignty DAO."
        },
        {
            title: "🛡️ Security Architecture (The 4-Layer Shield)",
            content: "1. Quantum-Resistant Layer: Lattice-based HE and PQC. \n2. Atomic Privacy: Molecular-shell computation. \n3. DNA-Native: Long-term archival with Helical-indexing. \n4. Multi-Factor: 4FA Phone-grade biometric verification."
        },
        {
            title: "🧬 Biogenetic Synthesis Ethics",
            content: "Automated synthesis of mRNA and CRISPR sequences is governed by the Immunity Firewall. Any sequence identified as high-risk initiates a planetary quarantine protocol and autonomous sequence-lock."
        }
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem' }}><span className="emoji">📚</span> <span className="gradient-text">Knowledge Sovereignty</span></h1>
                <p>The technical and ethical foundation of the FederiGene ecosystem.</p>
            </div>

            <div className="grid-2">
                <div className="content-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))' }}>
                    <h2><span className="emoji">🧬</span> <span className="gradient-text">Technical Whitepaper: FederiGene Protocol</span></h2>
                    <p style={{ lineHeight: '1.8', opacity: 0.8 }}>
                        The FederiGene platform represents the convergence of Federated Learning, Genomic Artificial Intelligence, and Decentralized Tokenomics.
                        By utilizing Homomorphic Encryption (HE) and Differential Privacy (DP), we ensure that raw patient data never leaves its original silo.
                        FederiGene introduces a novel FedCoin ecosystem that automatically rewards hospitals and institutions via simulated smart contracts.
                    </p>
                    <button 
                        className="action-btn" 
                        style={{ marginTop: '1rem' }}
                        onClick={handleDownload}
                    >
                        Download Whitepaper (PDF)
                    </button>
                </div>

                {sections.map(section => (
                    <div key={section.title} className="content-card">
                        <h3>{section.title.split(' ')[0] && section.title.split(' ')[0].length > 1 ? <><span className="emoji">{section.title.split(' ')[0]}</span> <span className="gradient-text">{section.title.split(' ').slice(1).join(' ')}</span></> : section.title}</h3>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{section.content}</p>
                    </div>
                ))}

                <div className="content-card" style={{ gridColumn: 'span 2' }}>
                    <h3><span className="emoji">🔧</span> <span className="gradient-text">Global API Documentation</span></h3>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        <div style={{ color: '#10b981' }}>// GET /api/guardian/status</div>
                        <div style={{ opacity: 0.6 }}>{`{
  "equilibrium_index": "99.9999%",
  "planetary_sovereignty": "ABSOLUTE",
  "system_state": "AUTONOMOUS-EQUILIBRIUM"
}`}</div>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.5 }}>
                        Integrate your local Bio-Foundry or Hospital Node using our secure REST/WebSocket SDK.
                    </p>
                </div>
            </div>
        </div>
    );
}
