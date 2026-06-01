import { useState, useEffect, useRef, useCallback } from 'react';

const TOUR_STEPS = [
    {
        target: 'body',
        title: '🚀 Welcome to FederiGene Omega',
        content: "Let's take a quick tour of your AI-driven genomics command center. This will only take a moment!",
        position: 'center',
    },
    {
        target: '.sidebar-nav .nav-section:nth-child(1)',
        title: '📊 Core Modules',
        content: 'Your primary navigation. Access Training Jobs, Model Registry, Datasets, Marketplace, and the Edge Optimizer.',
    },
    {
        target: '.sidebar-nav .nav-section:nth-child(2)',
        title: '🧪 Analysis & Discovery',
        content: 'Run federated analytics, use the Privacy Sandbox, explore Population Health, and more.',
    },
    {
        target: '.sidebar-nav .nav-section:nth-child(3)',
        title: '🔬 Clinical Suite',
        content: 'Autonomous Agents, Biogenetic Synthesis, Neural Co-Evolution, and the Synthetic Bio-OS.',
    },
    {
        target: '.sidebar-nav .nav-section:nth-child(5)',
        title: '🛡️ Security Stack',
        content: 'Atomic Privacy, Quantum Shield, Key Management, Trust Explorer, and full Audit Logs.',
    },
    {
        target: '.profile-wrapper',
        title: '👤 Your Profile',
        content: 'Manage your account, organization settings, billing, and team members here.',
    },
    {
        target: '.chat-agent-toggle',
        title: '🤖 AI Support Agent',
        content: 'Need help? Click this to talk with our intelligent assistant. It knows the entire platform!',
    },
];

const STORAGE_KEY = 'fg-onboarding-done';

export default function OnboardingTour() {
    const [step, setStep] = useState(-1);
    const [spotlightRect, setSpotlightRect] = useState<any>(null);
    const tooltipRef = useRef<any>(null);

    // Only start if not seen before
    useEffect(() => {
        try {
            const seen = localStorage.getItem(STORAGE_KEY);
            if (!seen) {
                const timer = setTimeout(() => setStep(0), 1500);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            // localStorage may be blocked
        }
    }, []);

    // Position the spotlight on every step change
    useEffect(() => {
        if (step < 0 || step >= TOUR_STEPS.length) return;

        const { target, position } = TOUR_STEPS[step];

        if (position === 'center' || target === 'body') {
            setSpotlightRect(null);
            return;
        }

        const el = document.querySelector(target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setSpotlightRect({
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
            });
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            setSpotlightRect(null);
        }
    }, [step]);

    const finish = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) { /* ignore */ }
        setStep(-1);
    }, []);

    const next = () => {
        if (step >= TOUR_STEPS.length - 1) {
            finish();
        } else {
            setStep(s => s + 1);
        }
    };

    const back = () => {
        if (step > 0) setStep(s => s - 1);
    };

    if (step < 0 || step >= TOUR_STEPS.length) return null;

    const current = TOUR_STEPS[step];
    const isCenter = current.position === 'center' || current.target === 'body';
    const isLast = step === TOUR_STEPS.length - 1;

    // Compute tooltip position intelligently
    let tooltipStyle = {};
    const PADDING = 20;

    if (isCenter) {
        tooltipStyle = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        };
    } else if (spotlightRect) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tooltipWidth = 360;
        const tooltipHeight = 220; // Estimated max height

        // 1. Initial candidates
        let top = spotlightRect.top + spotlightRect.height + 16;
        let left = spotlightRect.left;

        // 2. Adjust Horizontal (Left/Right)
        if (left + tooltipWidth > vw - PADDING) {
            // Push it left from the right edge
            left = vw - tooltipWidth - PADDING;
        }
        if (left < PADDING) {
            left = PADDING;
        }

        // 3. Adjust Vertical (Above/Below)
        if (top + tooltipHeight > vh - PADDING) {
            // Not enough room below? Put it above.
            top = spotlightRect.top - tooltipHeight - 16;
        }
        
        // 4. Handle extreme case (too big for both, let's just use the safer calculation)
        if (top < PADDING) top = PADDING;

        tooltipStyle = {
            position: 'fixed',
            top: top,
            left: left,
        };
    }

    return (
        <div className="tour-overlay" style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            pointerEvents: 'auto',
        }}>
            {/* Dark overlay with cutout */}
            <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}>
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {spotlightRect && (
                            <rect
                                x={spotlightRect.left}
                                y={spotlightRect.top}
                                width={spotlightRect.width}
                                height={spotlightRect.height}
                                rx="8"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0" y="0" width="100%" height="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#tour-mask)"
                />
            </svg>

            {/* Spotlight border glow */}
            {spotlightRect && (
                <div style={{
                    position: 'fixed',
                    top: spotlightRect.top,
                    left: spotlightRect.left,
                    width: spotlightRect.width,
                    height: spotlightRect.height,
                    borderRadius: '8px',
                    border: '2px solid rgba(107, 70, 193, 0.6)',
                    boxShadow: '0 0 20px rgba(107, 70, 193, 0.3)',
                    pointerEvents: 'none',
                }} />
            )}

            {/* Tooltip */}
            <div ref={tooltipRef} style={{
                ...tooltipStyle,
                maxWidth: '360px',
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                zIndex: 100000,
                color: '#1a1a2e',
                animation: 'tourFadeIn 0.25s ease',
            }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700 }}>
                    {current.title}
                </h4>
                <p style={{ margin: '0 0 20px', fontSize: '0.9rem', lineHeight: 1.5, color: '#555' }}>
                    {current.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: i === step ? '#6B46C1' : '#ddd',
                                transition: 'background 0.2s',
                            }} />
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {step === 0 && (
                            <button onClick={finish} style={{
                                background: 'none', border: 'none', color: '#999',
                                cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px',
                            }}>
                                Skip Tour
                            </button>
                        )}
                        {step > 0 && (
                            <button onClick={back} style={{
                                background: 'none', border: 'none', color: '#6B46C1',
                                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: '6px 12px',
                            }}>
                                Back
                            </button>
                        )}
                        <button onClick={next} style={{
                            background: '#6B46C1', color: '#fff', border: 'none',
                            padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.9rem', fontWeight: 600,
                        }}>
                            {isLast ? 'Done' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes tourFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
