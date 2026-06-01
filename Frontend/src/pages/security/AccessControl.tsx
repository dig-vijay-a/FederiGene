import { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';

export default function AccessControl() {
    usePageTitle('Access Control');
    return (
        <div>
            <div className="page-header">
                <h1><span className="gradient-text">Access Control (RBAC) </span><span className="emoji">🛡️</span></h1>
                <p>System-wide permissions and Role-Based Access definitions and capabilities.</p>
            </div>

            <div className="content-card">
                <h3>System Roles</h3>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '2rem' }}>
                    FederiGene strictly enforces minimum privilege through JWT-based Role-Based Access Control on all backend API routes.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>Platform Admin</h4>
                        <ul style={{ fontSize: '0.85rem', opacity: 0.9, paddingLeft: 20, margin: 0 }}>
                            <li>Approve or reject organization registrations.</li>
                            <li>View cross-organization audit trails and system health.</li>
                            <li>Manage global cryptographic keys and platform settings.</li>
                        </ul>
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>Hospital Admin</h4>
                        <ul style={{ fontSize: '0.85rem', opacity: 0.9, paddingLeft: 20, margin: 0 }}>
                            <li>Register their hospital, lab, or institution on the network.</li>
                            <li>Invite researchers and data custodians to their organization.</li>
                            <li>Generate API credentials for local training nodes.</li>
                        </ul>
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Researcher</h4>
                        <ul style={{ fontSize: '0.85rem', opacity: 0.9, paddingLeft: 20, margin: 0 }}>
                            <li>Create federated learning training jobs.</li>
                            <li>Monitor live training rounds and model accuracy metrics.</li>
                            <li>View and download finalized aggregated model weights.</li>
                        </ul>
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#8b5cf6' }}>Data Custodian</h4>
                        <ul style={{ fontSize: '0.85rem', opacity: 0.9, paddingLeft: 20, margin: 0 }}>
                            <li>Register dataset schemas and metadata to the platform state.</li>
                            <li>Set governance policies on which models are allowed to train on their data.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
