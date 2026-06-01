import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PushNotifications } from '@capacitor/push-notifications';
import { useEffect } from 'react';
import './index.css';

// Real components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Passport from './pages/GenomicPassport';
import Rewards from './pages/Rewards';
import AI from './pages/AIAssistant';
import Settings from './pages/Settings';
import PersonalInfo from './pages/PersonalInfo';
import Security from './pages/Security';
import Intro from './pages/Intro';
import TopNav from './components/TopNav';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Establishing Secure Link...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const InitialRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

const MobileNav = () => {
    const { user } = useAuth();
    if (!user) return null;
    
    return (
        <nav className="mobile-nav">
            <NavLink to="/dashboard" className="nav-item">
                <span className="nav-icon">🏠</span>
                <span>Home</span>
            </NavLink>
            <NavLink to="/passport" className="nav-item">
                <span className="nav-icon">🧬</span>
                <span>Passport</span>
            </NavLink>
            <NavLink to="/rewards" className="nav-item">
                <span className="nav-icon">💰</span>
                <span>Rewards</span>
            </NavLink>
            <NavLink to="/ai" className="nav-item">
                <span className="nav-icon">🤖</span>
                <span>Support</span>
            </NavLink>
        </nav>
    );
};

import api from './utils/api';

function App() {
    useEffect(() => {
        const initPush = async () => {
            try {
                await PushNotifications.addListener('registration', token => {
                    console.log('Push registration success, token: ' + token.value);
                    localStorage.setItem('fcm_token', token.value);
                    api.post('/patient/fcm-token', { token: token.value }).catch(err => console.error("Failed to update FCM token", err));
                });

                await PushNotifications.addListener('pushNotificationReceived', notification => {
                    console.log('Push received: ', notification);
                });

                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }
                if (permStatus.receive === 'granted') {
                    await PushNotifications.register();
                }
            } catch (e) {
                console.log('Push notifications not available on this platform', e);
            }
        };
        initPush();
    }, []);

    return (
        <ToastProvider>
            <AuthProvider>
                <Router>
                    <TopNav />
                    <div className="app-container">
                        <Routes>
                            <Route path="/intro" element={<Intro />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/passport" element={<ProtectedRoute><Passport /></ProtectedRoute>} />
                            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                            <Route path="/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/settings/personal-info" element={<ProtectedRoute><PersonalInfo /></ProtectedRoute>} />
                            <Route path="/settings/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                            <Route path="/" element={<InitialRoute />} />
                        </Routes>
                        <MobileNav />
                    </div>
                </Router>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
