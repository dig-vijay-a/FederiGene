import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="glass-card not-found-card">
        <div className="visual-404">
            <div className="glow-sphere"></div>
            <div className="error-code">404</div>
            <div className="floating-elements">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>
        </div>
        
        <h1><span className="gradient-text">Connection Lost</span></h1>
        <p className="subtitle">
          The node or page you are looking for does not exist, or you lack the required access clearance.
        </p>

        <div className="action-buttons">
          <button className="action-btn" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
          <button className="action-btn primary" onClick={() => navigate('/')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
