import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Configure automatic retries for idempotent requests (GET, HEAD, OPTIONS, PUT, DELETE)
axiosRetry(api, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response ? error.response.status >= 500 : false);
    }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
            // Don't redirect during multi-step login flow
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
                // Only redirect for actual session expiry on protected routes
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
        }
        
        // Dispatch global error event for the UI toast provider to catch
        if (error.response && error.response.status >= 500) {
            const event = new CustomEvent('api-error', { 
                detail: { message: 'Server unavailable. Retrying connection...' } 
            });
            window.dispatchEvent(event);
        }

        return Promise.reject(error);
    }
);

export default api;
