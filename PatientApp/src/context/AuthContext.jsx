import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) { setLoading(false); return; }
            const res = await api.get('/users/me');
            setUser({ ...res.data, isAuthenticated: true });
        } catch {
            localStorage.removeItem('access_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const login = (userData, accessToken) => {
        localStorage.setItem('access_token', accessToken);
        setUser({ ...userData, isAuthenticated: true });
        setTimeout(fetchProfile, 100);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser: fetchProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
