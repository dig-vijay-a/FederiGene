import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://federigene-backend.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        // Reject HTML responses to prevent silent failures when proxy/capacitor returns index.html
        if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
            console.error("API returned HTML instead of JSON. Check API URL.");
            return Promise.reject({ response: { data: { detail: "Network error: Cannot reach API." } } });
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            const url = error.config?.url || '';
            const isLoginFlow = [
                '/auth/login',
                '/auth/verify-2fa',
                '/auth/verify-face',
                '/auth/verify-fingerprint',
                '/auth/webauthn-login-options',
                '/auth/verify-otp',
                '/auth/verify-security-question',
                '/auth/reset-password',
            ].some(path => url.includes(path));

            if (!isLoginFlow) {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
