// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './GlobalSearch.css';

const SEARCHABLE_ITEMS = [
    { category: 'Main', icon: '📊', label: 'Dashboard', desc: 'Overview & stats', path: '/dashboard' },
    { category: 'Main', icon: '🧠', label: 'Training Jobs', desc: 'Federated model training', path: '/training' },
    { category: 'Main', icon: '⚡', label: 'Edge Optimizer', desc: 'Local node compute', path: '/training/edge' },
    { category: 'Main', icon: '📦', label: 'Model Registry', desc: 'Version control for weights', path: '/models' },
    { category: 'Main', icon: '🏪', label: 'Marketplace', desc: 'Browse & publish models', path: '/marketplace' },
    { category: 'Main', icon: '🗂️', label: 'Datasets', desc: 'Institutional genomic data', path: '/datasets' },
    { category: 'Main', icon: '⚖️', label: 'Compliance & Audits', desc: 'HIPAA & GDPR logs', path: '/datasets/compliance' },
    { category: 'Analysis', icon: '🧬', label: 'Privacy Sandbox', desc: 'Safe experimentation zone', path: '/analysis/sandbox' },
    { category: 'Analysis', icon: '📈', label: 'Population Health', desc: 'Cohort-level insights', path: '/analysis/population' },
    { category: 'Analysis', icon: '🧠', label: 'Universal Intelligence', desc: 'Singularity engine', path: '/analysis/singularity' },
    { category: 'Analysis', icon: '🌌', label: 'Omega Biosphere', desc: 'Full ecosystem view', path: '/analysis/omega' },
    { category: 'Analysis', icon: '👁️', label: 'Multi-Modal IQ', desc: 'Cross-modal analysis', path: '/analysis/multimodal' },
    { category: 'Clinical', icon: '🤖', label: 'Autonomous Agents', desc: 'AI-driven clinical workflows', path: '/clinical/agents' },
    { category: 'Clinical', icon: '🔬', label: 'Biogenetic Synthesis', desc: 'Synthetic genomics', path: '/clinical/synthesis' },
    { category: 'Clinical', icon: '🧠', label: 'Neural Co-Evolution', desc: 'Adaptive neural nets', path: '/clinical/neural' },
    { category: 'Clinical', icon: '💻', label: 'Synthetic Bio-OS', desc: 'Biological operating system', path: '/clinical/bios' },
    { category: 'Security', icon: '⚛️', label: 'Atomic Privacy', desc: 'Granular data controls', path: '/security/atomic' },
    { category: 'Security', icon: '⚛️', label: 'Quantum Shield', desc: 'Post-quantum encryption', path: '/security/quantum' },
    { category: 'Security', icon: '⛓️', label: 'Trust Explorer', desc: 'Blockchain audit trail', path: '/security/trust' },
    { category: 'Security', icon: '🔑', label: 'Key Management', desc: 'Encryption key lifecycle', path: '/security/keys' },
    { category: 'Security', icon: '📋', label: 'Audit Logs', desc: 'Activity history', path: '/security/audit' },
    { category: 'Settings', icon: '👤', label: 'Account Settings', desc: 'Profile & preferences', path: '/settings/account' },
    { category: 'Settings', icon: '🏢', label: 'Organization Settings', desc: 'Org-level configuration', path: '/org/settings' },
    { category: 'Settings', icon: '💳', label: 'Billing & Tiers', desc: 'Subscription management', path: '/org/billing' },
];

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    const toggleSearch = useCallback(() => {
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
    }, []);

    // Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleSearch();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSearch]);

    // Filter results
    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return SEARCHABLE_ITEMS.filter(item =>
            item.label.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [query]);

    // Group results by category
    const grouped = useMemo(() => {
        const map = {};
        results.forEach(item => {
            if (!map[item.category]) map[item.category] = [];
            map[item.category].push(item);
        });
        return map;
    }, [results]);

    // Navigate on select
    const handleSelect = (path) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex].path);
        }
    };

    if (!isOpen) return null;

    // Flatten index tracking for grouped items
    let flatIdx = 0;

    return (
        <div className="gs-overlay" onClick={() => { setIsOpen(false); setQuery(''); }}>
            <div className="gs-modal" onClick={e => e.stopPropagation()}>
                {/* Input Bar */}
                <div className="gs-input-bar">
                    <svg className="gs-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className="gs-input"
                        autoFocus
                        placeholder="Search modules, engines, settings..."
                        value={query}
                        onChange={e => setQuery((e.target as any).value)}
                        onKeyDown={handleKeyDown}
                    />
                    <span className="gs-kbd">ESC</span>
                </div>

                {/* Results */}
                <div className="gs-results">
                    {query.trim() ? (
                        results.length > 0 ? (
                            Object.entries(grouped).map(([category, items]) => (
                                <div key={category}>
                                    <div className="gs-category">{category}</div>
                                    {items.map(item => {
                                        const thisIdx = flatIdx++;
                                        return (
                                            <div
                                                key={item.path}
                                                className={`gs-item ${selectedIndex === thisIdx ? 'gs-active' : ''}`}
                                                onClick={() => handleSelect(item.path)}
                                                onMouseEnter={() => setSelectedIndex(thisIdx)}
                                            >
                                                <div className="gs-item-icon">{item.icon}</div>
                                                <div className="gs-item-text">
                                                    <div className="gs-item-label">{item.label}</div>
                                                    <div className="gs-item-desc">{item.desc}</div>
                                                </div>
                                                <span className="gs-item-jump">⏎ Jump</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        ) : (
                            <div className="gs-empty">No results found for "{query}"</div>
                        )
                    ) : (
                        <div className="gs-quicknav">
                            <div className="gs-quicknav-title">Quick Navigation</div>
                            <div className="gs-quicknav-grid">
                                {SEARCHABLE_ITEMS.slice(0, 8).map(item => (
                                    <div key={item.path} className="gs-quicknav-item" onClick={() => handleSelect(item.path)}>
                                        <span className="gs-quicknav-emoji">{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="gs-footer">
                    <span><kbd>↑↓</kbd> Navigate</span>
                    <span><kbd>⏎</kbd> Select</span>
                    <span><kbd>Esc</kbd> Close</span>
                </div>
            </div>
        </div>
    );
}
