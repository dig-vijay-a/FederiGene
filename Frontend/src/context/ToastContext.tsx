import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
    show: boolean;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'error' });

    const showToast = useCallback((message: string, type: ToastType = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    }, []);

    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastUI toast={toast} onHide={hideToast} />
        </ToastContext.Provider>
    );
};

const ToastUI = ({ toast, onHide }: { toast: ToastState; onHide: () => void }) => {
    if (!toast.show) return null;

    return (
        <div className={`toast-notification ${toast.type} ${toast.show ? 'slide-in' : ''}`} onClick={onHide}>
            <div className="toast-content">
                <span className="toast-icon">
                    {toast.type === 'error' ? '🚫' : toast.type === 'success' ? '✅' : 'ℹ️'}
                </span>
                <p className="toast-message">{toast.message}</p>
            </div>
            <div className="toast-progress"></div>
        </div>
    );
};
