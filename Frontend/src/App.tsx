import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { CustomAlertProvider } from './context/CustomAlertProvider'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import DashboardLayout from './components/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import TrainingList from './pages/training/TrainingList'
import TrainingMonitor from './pages/training/TrainingMonitor'
import EdgeOptimization from './pages/training/EdgeOptimization'
import DatasetList from './pages/datasets/DatasetList'
import DataPolicies from './pages/datasets/DataPolicies'
import ConsentManagement from './pages/datasets/ConsentManagement'
import ModelRegistry from './pages/models/ModelRegistry'
import ModelExplainability from './pages/models/ModelExplainability'
import ModelCompare from './pages/models/ModelCompare'
import MarketplaceHome from './pages/marketplace/MarketplaceHome'
import CommercialMarketplace from './pages/marketplace/CommercialMarketplace'
import ComplianceReport from './pages/security/ComplianceReport'
import OrgProfile from './pages/org/OrgProfile'
import TeamMembers from './pages/org/TeamMembers'
import ApiKeys from './pages/org/ApiKeys'
import OrgSettings from './pages/org/OrgSettings'
import AccountSettings from './pages/settings/AccountSettings'
import SubscriptionManager from './pages/billing/SubscriptionManager'
import FedcoinWallet from './pages/billing/FedcoinWallet'
import FederatedQuery from './pages/analysis/FederatedQuery'
import PrivacySandbox from './pages/analysis/PrivacySandbox'
import PopulationHealth from './pages/analysis/PopulationHealth'
import UniversalIntelligence from './pages/analysis/UniversalIntelligence'
import OmegaBiosphere from './pages/analysis/OmegaBiosphere'
import EvolutionarySteering from './pages/analysis/EvolutionarySteering'
import MultiModalIQ from './pages/analysis/MultiModalIQ'
import SystemObservability from './pages/admin/SystemObservability'
import RegulatoryCompliance from './pages/admin/RegulatoryCompliance'
import GlobalSovereignty from './pages/admin/GlobalSovereignty'
import InterplanetaryLedger from './pages/admin/InterplanetaryLedger'
import ImmunityFirewall from './pages/admin/ImmunityFirewall'
import EternalGuardian from './pages/admin/EternalGuardian'
import AutonomousAgents from './pages/clinical/AutonomousAgents'
import BiogeneticSynthesis from './pages/clinical/BiogeneticSynthesis'
import NeuralCoevolution from './pages/clinical/NeuralCoevolution'
import SyntheticOS from './pages/clinical/SyntheticOS'
import CollectiveIntelligence from './pages/clinical/CollectiveIntelligence'
import ExpertValidation from './pages/clinical/ExpertValidation'
import SecurityDashboard from './pages/security/SecurityDashboard'
import SecurityIntegrity from './pages/security/SecurityIntegrity'
import KeyManagement from './pages/security/KeyManagement'
import AtomicPrivacy from './pages/security/AtomicPrivacy'
import AccessControl from './pages/security/AccessControl'
import AuditLogs from './pages/security/AuditLogs'
import TrustExplorer from './pages/security/TrustExplorer'
import QuantumShield from './pages/security/QuantumShield'
import OrgApprovals from './pages/admin/OrgApprovals'
import SalesLeads from './pages/admin/SalesLeads'
import AdminUsers from './pages/admin/AdminUsers'
import InvoicePayment from './pages/billing/InvoicePayment'
import HelpCenter from './pages/support/HelpCenter'
import LocalNodeConfig from './pages/LocalNodeConfig'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/error/NotFound'
import './App.css'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="absolute top-right theme-switch-wrapper" style={{ position: 'absolute', top: 20, right: 20, margin: 0, zIndex: 1001 }}>
      <label className="theme-switch" aria-label="Toggle Dark Mode">
        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
        <span className="slider"></span>
        <span className="slider-icon sun"><img src="/sun_3d.png" alt="Light Mode" style={{ width: '16px', height: '16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} /></span>
        <span className="slider-icon moon"><img src="/crescent_moon_3d.png" alt="Dark Mode" style={{ width: '16px', height: '16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} /></span>
      </label>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-color)' }}>Loading…</div>
  if (!user?.isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-color)' }}>Loading…</div>
  if (user?.isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  const isDesktop = !import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <LanguageProvider>
      <CustomAlertProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/" element={isDesktop ? <Navigate to="/login" replace /> : <PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
                <Route path="/login" element={<PublicOnlyRoute><div className="app-container"><ThemeToggle /><Login /></div></PublicOnlyRoute>} />
                <Route path="/register" element={<PublicOnlyRoute><div className="app-container"><ThemeToggle /><Register /></div></PublicOnlyRoute>} />
                <Route path="/forgot-password" element={<PublicOnlyRoute><div className="app-container"><ThemeToggle /><ForgotPassword /></div></PublicOnlyRoute>} />
                <Route path="/verify-email" element={<div className="app-container"><ThemeToggle /><VerifyEmail /></div>} />
                
                {/* Public Invoice Payment */}
                <Route path="/billing/invoice/:invoiceId" element={<div className="app-container"><ThemeToggle /><InvoicePayment /></div>} />

                {/* Protected Dashboard Routes */}
                <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/local-node" element={<LocalNodeConfig />} />
                  <Route path="/training" element={<TrainingList />} />
                  <Route path="/training/edge" element={<EdgeOptimization />} />
                  <Route path="/training/:id" element={<TrainingMonitor />} />
                  <Route path="/datasets" element={<DatasetList />} />
                  <Route path="/datasets/:id/policies" element={<DataPolicies />} />
                  <Route path="/datasets/:id/consent" element={<ConsentManagement />} />
                  <Route path="/models" element={<ModelRegistry />} />
                  <Route path="/models/:id/explain" element={<ModelExplainability />} />
                  <Route path="/models/compare" element={<ModelCompare />} />
                  <Route path="/org/profile" element={<OrgProfile />} />
                  <Route path="/org/team" element={<TeamMembers />} />
                  <Route path="/org/api-keys" element={<ApiKeys />} />
                  <Route path="/org/billing" element={<SubscriptionManager />} />
                  <Route path="/analysis/query" element={<FederatedQuery />} />
                  <Route path="/analysis/sandbox" element={<PrivacySandbox />} />
                  <Route path="/analysis/population" element={<PopulationHealth />} />
                  <Route path="/analysis/singularity" element={<UniversalIntelligence />} />
                  <Route path="/analysis/omega" element={<OmegaBiosphere />} />
                  <Route path="/analysis/steering" element={<EvolutionarySteering />} />
                  <Route path="/analysis/multimodal" element={<MultiModalIQ />} />
                  <Route path="/admin/health" element={<SystemObservability />} />
                  <Route path="/admin/compliance" element={<RegulatoryCompliance />} />
                  <Route path="/admin/sovereignty" element={<GlobalSovereignty />} />
                  <Route path="/admin/interplanetary" element={<InterplanetaryLedger />} />
                  <Route path="/admin/immunity" element={<ImmunityFirewall />} />
                  <Route path="/admin/guardian" element={<EternalGuardian />} />
                  <Route path="/clinical/agents" element={<AutonomousAgents />} />
                  <Route path="/clinical/synthesis" element={<BiogeneticSynthesis />} />
                  <Route path="/clinical/neural" element={<NeuralCoevolution />} />
                  <Route path="/clinical/bios" element={<SyntheticOS />} />
                  <Route path="/clinical/collective" element={<CollectiveIntelligence />} />
                  <Route path="/clinical/validation" element={<ExpertValidation />} />
                  <Route path="/org/settings" element={<OrgSettings />} />
                  <Route path="/settings/account" element={<AccountSettings />} />
                  <Route path="/security" element={<SecurityDashboard />} />
                  <Route path="/security/integrity" element={<SecurityIntegrity />} />
                  <Route path="/security/keys" element={<KeyManagement />} />
                  <Route path="/security/atomic" element={<AtomicPrivacy />} />
                  <Route path="/security/access" element={<AccessControl />} />
                  <Route path="/security/audit" element={<AuditLogs />} />
                  <Route path="/security/trust" element={<TrustExplorer />} />
                  <Route path="/security/quantum" element={<QuantumShield />} />
                  <Route path="/security/compliance/:id" element={<ComplianceReport />} />
                  <Route path="/marketplace" element={<MarketplaceHome />} />
                  <Route path="/marketplace/commercial" element={<CommercialMarketplace />} />
                  <Route path="/admin/approvals" element={<OrgApprovals />} />
                  <Route path="/admin/sales-leads" element={<SalesLeads />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/support/help" element={<HelpCenter />} />
                  <Route path="/fedcoin" element={<FedcoinWallet />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </CustomAlertProvider>
    </LanguageProvider>
  )
}

export default App
