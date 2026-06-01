import usePageTitle from '../../hooks/usePageTitle';
import { useAppStore } from '../../store';

export default function ExpertValidation() {
    usePageTitle('Expert Validation');
    
    // Replace local state with global Zustand store
    const tasks = useAppStore((state) => state.validationTasks);
    const updateValidationTaskStatus = useAppStore((state) => state.updateValidationTaskStatus);

    const handleApprove = (id: string) => {
        updateValidationTaskStatus(id, 'Approved');
    };

    const handleReject = (id: string) => {
        updateValidationTaskStatus(id, 'Rejected');
    };

    return (
        <div className="validation-container">
            <div className="page-header">
                <h1><span className="gradient-text">Expert Validation Portal </span><span className="emoji">👨‍⚕️</span></h1>
                <p>Human-in-the-loop oversight for high-stakes clinical AI models.</p>
            </div>

            <div className="content-card">
                <h3>Pending Validation Tasks</h3>
                <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Review models where confidence is below threshold or manual sign-off is required.</p>

                <table className="data-table" style={{ marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th>Task ID</th>
                            <th>Target Model</th>
                            <th>Subject Ref</th>
                            <th>AI Confidence</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id}>
                                <td style={{ fontWeight: 600 }}>{task.id}</td>
                                <td>{task.model}</td>
                                <td style={{ fontFamily: 'monospace' }}>{task.subject}</td>
                                <td>
                                    <div className="confidence-pill" style={{
                                        width: '100px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${task.confidence * 100}%`, height: '100%', background: task.confidence > 0.8 ? '#22c55e' : '#f59e0b'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{(task.confidence * 100).toFixed(0)}%</span>
                                </td>
                                <td>
                                    {task.status === 'Pending' ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="primary-btn sm" onClick={() => handleApprove(task.id)}>Validate</button>
                                            <button className="secondary-btn sm" onClick={() => handleReject(task.id)}>Reject</button>
                                        </div>
                                    ) : (
                                        <span className={`badge badge-${task.status === 'Approved' ? 'success' : 'danger'}`}>
                                            {task.status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="validation-footer" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="content-card glass-card">
                    <h4>Clinical Sign-off Policy</h4>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>As per HIPAA/GDPR guidelines, automated inference for oncology models requires secondary validation by a board-certified expert.</p>
                </div>
                <div className="content-card glass-card">
                    <h4>Consensus Metrics</h4>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Expert-AI agreement rate for this session: <strong style={{ color: '#22c55e' }}>94.2%</strong></p>
                </div>
            </div>

            <style>{`
                .primary-btn.sm { padding: 4px 10px; font-size: 0.75rem; cursor: pointer; }
                .secondary-btn.sm { padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; }
                .badge-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; }
            `}</style>
        </div>
    );
}
