import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// import { useTranslation } from '../context/LanguageContext';
import OnboardingTour from './OnboardingTour';
import ChatAgent from './ChatAgent';
import GlobalSearch from './GlobalSearch';
import { useState, useRef, useEffect } from 'react';
import './DashboardLayout.css';

const NAV_ITEMS = {
    common: [
        { path: '/dashboard', icon: '📊', label: 'Dashboard', exact: true },
        { path: '/local-node', icon: '💻', label: 'Local Node' },
        { path: '/training', icon: '🧠', label: 'Training Jobs', exact: true },
        { path: '/training/edge', icon: '⚡', label: 'Edge Optimizer' },
        { path: '/models', icon: '📦', label: 'Model Registry' },
        { path: '/marketplace', icon: '🏪', label: 'Marketplace' },
        { path: '/datasets', icon: '🗂️', label: 'Datasets', exact: true },
        { path: '/support/help', icon: '📚', label: 'Knowledge Base' },
    ],
    analysis: [
        { path: '/analysis/query', icon: '🧪', label: 'Federated Analytics' },
        { path: '/analysis/sandbox', icon: '🧬', label: 'Privacy Sandbox' },
        { path: '/analysis/population', icon: '📈', label: 'Population Health' },
        { path: '/analysis/singularity', icon: '🧠', label: 'Universal Intelligence' },
        { path: '/analysis/omega', icon: '🌌', label: 'Omega Biosphere' },
        { path: '/analysis/steering', icon: '🧬', label: 'Evolutionary Steering' },
        { path: '/analysis/multimodal', icon: '👁️', label: 'Multi-Modal IQ' },

    ],
    org: [
        { path: '/org/profile', icon: '🏥', label: 'Organization' },
        { path: '/org/team', icon: '👥', label: 'Team Members' },
        { path: '/org/api-keys', icon: '🔑', label: 'API Credentials' },
        { path: '/org/billing', icon: '💳', label: 'Billing & Tiers' },
    ],
    settings: [
        { path: '/org/settings', icon: '🏢', label: 'Org Settings' },
        { path: '/settings/account', icon: '👤', label: 'Account Settings' },
    ],
    security: [
        { path: '/security', icon: '🔐', label: 'Security Overview' },
        { path: '/security/integrity', icon: '💎', label: 'System Integrity' },
        { path: '/security/keys', icon: '🔑', label: 'Key Management' },
        { path: '/security/atomic', icon: '⚛️', label: 'Atomic Privacy' },
        { path: '/security/access', icon: '🛡️', label: 'Access Control' },
        { path: '/security/audit', icon: '📋', label: 'Audit Logs' },
        { path: '/security/trust', icon: '⛓️', label: 'Trust Explorer' },
        { path: '/security/quantum', icon: '⚛️', label: 'Quantum Shield' },
    ],
    clinical: [
        { path: '/clinical/validation', icon: '👨‍⚕️', label: 'HITL Validation' },
        { path: '/clinical/agents', icon: '🤖', label: 'Autonomous Agents' },
        { path: '/clinical/synthesis', icon: '🧬', label: 'Biogenetic Synthesis' },
        { path: '/clinical/neural', icon: '🧠', label: 'Neural Co-Evolution' },
        { path: '/clinical/bios', icon: '🔌', label: 'Synthetic Bio-OS' },
        { path: '/clinical/collective', icon: '🧠', label: 'Collective Intelligence' },
    ],
    admin: [
        { path: '/admin/approvals', icon: '✅', label: 'Org Approvals' },
        { path: '/admin/sales-leads', icon: '💼', label: 'Sales Leads' },
        { path: '/admin/users', icon: '👥', label: 'All Users' },
        { path: '/admin/health', icon: '💚', label: 'System Health' },
        { path: '/admin/interplanetary', icon: '🚀', label: 'Interplanetary Ledger' },
        { path: '/admin/immunity', icon: '🛡️', label: 'Immunity Firewall' },
        { path: '/admin/guardian', icon: '💎', label: 'Eternal Guardian' },
    ]
};

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    // const { lang, setLang, t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const role = user?.role || 'researcher';
    const isAdmin = role === 'platform_admin';
    const isHospitalAdmin = role === 'hospital_admin';

    const [pendingOrgsCount, setPendingOrgsCount] = useState(0);

    useEffect(() => {
        if (isAdmin) {
            const fetchPending = () => {
                import('../utils/api').then(({ default: api }) => {
                    api.get('/platform/orgs/pending')
                        .then(res => setPendingOrgsCount(res.data.length))
                        .catch(() => {});
                });
            };
            fetchPending();
            const interval = setInterval(fetchPending, 5000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    const handleSidebarClick = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar" onClick={handleSidebarClick}>
                <div className="sidebar-header">
                    <div className="sidebar-logo-container">
                        <img src="/logo.png" alt="FederiGene Logo" className="sidebar-logo-img" />
                        <h2 className="sidebar-logo-text">FederiGene</h2>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-label">Main</span>
                        {NAV_ITEMS.common.map(item => (
                            <NavLink key={item.path} to={item.path} end={item.exact}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-label">Analysis & Discovery</span>
                        {NAV_ITEMS.analysis.map(item => (
                            <NavLink key={item.path} to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-label">Clinical Suite</span>
                        {NAV_ITEMS.clinical.map(item => (
                            <NavLink key={item.path} to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-label">Organization</span>
                        {NAV_ITEMS.org.map(item => (
                            <NavLink key={item.path} to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-label">Security & Privacy</span>
                        {NAV_ITEMS.security.map(item => {
                            if ((item.path === '/security/keys' || item.path === '/security/access') && !(isAdmin || isHospitalAdmin)) {
                                return null;
                            }
                            return (
                                <NavLink key={item.path} to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>

                    <div className="nav-section">
                        <span className="nav-section-label">Settings</span>
                        {NAV_ITEMS.settings.map(item => (
                            <NavLink key={item.path} to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>

                    {isAdmin && (
                        <div className="nav-section">
                            <span className="nav-section-label">Platform Admin</span>
                            {NAV_ITEMS.admin.map(item => (
                                <NavLink key={item.path} to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-navbar">
                    <div className="header-left">
                        <div className="breadcrumb-nav">
                            {location.pathname.split('/').filter(p => p).map((part, index, array) => (
                                <span key={part} style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className={`breadcrumb-item ${index === array.length - 1 ? 'active' : ''}`}>
                                        {part.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    {index < array.length - 1 && <span className="breadcrumb-separator">/</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="header-actions">
                            {/* FedCoin Balance (Hidden for Custodians and Auditors) */}
                            {(role === 'platform_admin' || role === 'hospital_admin' || role === 'researcher') && (
                                <div className="fedcoin-pill" title="View FedCoin Wallet" onClick={() => navigate('/fedcoin')} style={{ cursor: 'pointer' }}>
                                    <img src="/coin_3d.png" alt="FedCoin" style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginRight: '4px' }} />
                                    <span className="coin-balance">{user?.fedcoin_balance?.toLocaleString() || 0}</span>
                                </div>
                            )}
                            
                            {isAdmin && (
                                <button className="header-btn" onClick={() => navigate('/admin/approvals')} title="Pending Approvals" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    🔔
                                    {pendingOrgsCount > 0 && (
                                        <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                            {pendingOrgsCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            
                            <button className="header-btn" onClick={toggleTheme} title="Toggle Theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {theme === 'dark' ? <img src="/sun_3d.png" alt="Light Mode" style={{ width: '20px', height: '20px' }} /> : <img src="/crescent_moon_3d.png" alt="Dark Mode" style={{ width: '20px', height: '20px' }} />}
                            </button>
                        </div>

                        <div className="profile-wrapper" ref={dropdownRef}>
                            <div className={`profile-trigger ${dropdownOpen ? 'active' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                                {user?.avatar_url ? (
                                    <img 
                                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${user.avatar_url}`} 
                                        alt="Avatar" 
                                        className="user-avatar-img" 
                                    />
                                ) : (
                                    <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
                                )}
                                <div className="user-text-details">
                                    <span className="user-name">{user?.username || 'User'}</span>
                                    <span className="user-role">{role.replace('_', ' ')}</span>
                                </div>
                                <span className="dropdown-chevron">{dropdownOpen ? '▴' : '▾'}</span>
                            </div>

                            {dropdownOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <strong>{user?.username}</strong>
                                        <span>{user?.email}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={() => { navigate('/settings/account'); setDropdownOpen(false); }}>
                                        <span className="item-icon">👤</span> Account Settings
                                    </button>
                                    <button className="dropdown-item" onClick={() => { navigate('/org/profile'); setDropdownOpen(false); }}>
                                        <span className="item-icon">🏥</span> Organization
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                                        <span className="item-icon">🚪</span> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="content-container">
                    <GlobalSearch />
                    <OnboardingTour />
                    <Outlet />
                    <ChatAgent />
                </div>
            </main>
        </div>
    );
}
