// @ts-nocheck
import { createContext, useState, useEffect } from 'react';

export const CustomAlertProvider = ({ children }) => {
    const [alertMessage, setAlertMessage] = useState<any>(null);

    useEffect(() => {
        // Override the native browser alert
        const originalAlert = window.alert;
        window.alert = (message) => {
            // Check if it's an object (sometimes errors are passed directly)
            let msgText = message;
            if (typeof message === 'object') {
                try {
                    msgText = JSON.stringify(message);
                } catch (e) {
                    msgText = String(message);
                }
            }
            setAlertMessage(msgText);
        };

        // Cleanup on unmount (though this provider usually wraps the whole app)
        return () => { window.alert = originalAlert; };
    }, []);

    const closeAlert = () => setAlertMessage(null);

    return (
        <>
            {children}
            {alertMessage !== null && (
                <div style={styles.overlay}>
                    <div className="glass-card" style={styles.dialog}>
                        <div style={styles.header}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)' }}>Notification</h3>
                        </div>
                        <div style={styles.body}>
                            <p style={{ margin: 0, color: 'var(--text-color)', opacity: 0.9, lineHeight: 1.5 }}>
                                {alertMessage}
                            </p>
                        </div>
                        <div style={styles.footer}>
                            <button className="action-btn" onClick={closeAlert} style={{ width: '100%' }}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999, // Ensure it's above everything including sidebars
    },
    dialog: {
        width: '90%',
        maxWidth: '400px',
        padding: '0',
        animation: 'fadeInUp 0.3s ease',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
    },
    header: {
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(255, 255, 255, 0.02)'
    },
    body: {
        padding: '1.5rem',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    },
    footer: {
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.1)'
    }
};
