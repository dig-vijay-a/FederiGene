import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './TopNav.css';

export default function TopNav() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // This handles clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.profile-menu')) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Effect to toggle theme classes on body
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        }
    }, [theme]);

    if (!user) return null;

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="top-nav">
            <div className="nav-left">
                <img src="/logo.png" alt="FederiGene" className="nav-logo" />
                <span className="nav-title gradient-text">FederiGene</span>
            </div>
            
            <div className="nav-right">
                <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                
                <div className="profile-menu">
                    <button 
                        className="profile-btn" 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="profile-avatar">
                            {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </div>
                    </button>
                    
                    {dropdownOpen && (
                        <div className="dropdown-menu glass-card">
                            <div className="dropdown-header">
                                <div style={{ fontWeight: 'bold' }}>{user.display_name || user.username}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.email}</div>
                            </div>
                            <hr />
                            <NavLink to="/settings/personal-info" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <span>👤</span> Account Settings
                            </NavLink>
                            <NavLink to="/settings/security" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <span>🔐</span> Change Password & 2FA
                            </NavLink>
                            <hr />
                            <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                <span>🚪</span> Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
