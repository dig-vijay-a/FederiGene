import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (userData: User, accessToken: string) => void;
    logout: () => void;
    refreshUser: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
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

    const login = (userData: User, accessToken: string) => {
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
