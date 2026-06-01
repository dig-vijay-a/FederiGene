export default function ModelNetworkViewer() {
    // Conceptual layers for a genomic model (e.g., Input -> Embed -> Dense -> Output)
    const layers = [
        { name: 'Input', size: 8, color: '#3b82f6' },
        { name: 'Embed', size: 12, color: '#8b5cf6' },
        { name: 'Latent', size: 12, color: '#ec4899' },
        { name: 'Output', size: 4, color: '#22c55e' }
    ];

    return (
        <div className="network-viewer content-card glass-card">
            <div className="viewer-header">
                <h3>Architecture Visualization</h3>
                <span className="badge badge-primary">Dynamic Rendering</span>
            </div>

            <div className="svg-container">
                <svg width="100%" height="100%" viewBox="0 0 300 350" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
                            <stop offset="100%" stopColor="rgba(34, 197, 94, 0.2)" />
                        </linearGradient>
                    </defs>

                    {/* Draw Connections */}
                    {layers.map((layer, lIdx) => {
                        if (lIdx === layers.length - 1) return null;
                        const nextLayer = layers[lIdx + 1];
                        return Array.from({ length: 5 }).map((_, i) => (
                            Array.from({ length: 5 }).map((_, j) => (
                                <line
                                    key={`line-${lIdx}-${i}-${j}`}
                                    x1={35 + lIdx * 75}
                                    y1={175 + (i - 2) * 55}
                                    x2={35 + (lIdx + 1) * 75}
                                    y2={175 + (j - 2) * 55}
                                    stroke="url(#lineGrad)"
                                    strokeWidth="1"
                                >
                                    <animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur={`${3 + lIdx}s`} repeatCount="indefinite" />
                                </line>
                            ))
                        ));
                    })}

                    {/* Draw Neurons */}
                    {layers.map((layer, lIdx) => (
                        <g key={`layer-${lIdx}`}>
                            <text
                                x={35 + lIdx * 75}
                                y={30}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="11"
                                fontWeight="600"
                                opacity="0.8"
                            >
                                {layer.name}
                            </text>
                            {Array.from({ length: 5 }).map((_, nIdx) => (
                                <circle
                                    key={`node-${lIdx}-${nIdx}`}
                                    cx={35 + lIdx * 75}
                                    cy={175 + (nIdx - 2) * 55}
                                    r="6"
                                    fill={layer.color}
                                    stroke="#fff"
                                    strokeWidth="1.5"
                                >
                                    <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                                </circle>
                            ))}
                        </g>
                    ))}
                </svg>
            </div>

            <div className="viewer-footer">
                <p>Interactive neural network visualization with gradient-traced weight connections.</p>
            </div>

            <style>{`
                .network-viewer { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin: 0; position: relative; overflow: hidden; display: flex; flex-direction: column; height: 100%; min-height: 480px; }
                .viewer-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .viewer-header h3 { margin: 0; font-size: 1rem; color: #fff; }
                .svg-container { flex: 1; padding: 20px 0; display: flex; align-items: center; justify-content: center; }
                .viewer-footer { padding: 15px 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); margin-top: auto; }
                .viewer-footer p { margin: 0; font-size: 0.8rem; opacity: 0.5; font-style: italic; }
            `}</style>
        </div>
    );
}
