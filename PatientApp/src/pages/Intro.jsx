import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';

const Intro = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/dashboard', { replace: true });
        }, 2000); // Show splash for 2 seconds
        
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="splash-container">
            <div className="splash-content">
                <img src="/logo.png" alt="FederiGene Logo" className="splash-logo" />
                <h1 className="splash-title">FederiGene</h1>
            </div>
            <div className="splash-footer">
                <p>from</p>
                <h3>FederiGene Foundation</h3>
            </div>
        </div>
    );
};

export default Intro;
