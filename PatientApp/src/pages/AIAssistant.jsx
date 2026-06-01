import React, { useState } from 'react';

export default function AIAssistant() {
    const [messages, setMessages] = useState([
        { role: 'agent', content: 'Hello! I am your FederiGene Health Assistant. How can I help you manage your genomic data today?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages([...messages, { role: 'user', content: input }]);
        setInput('');
        // Mock response
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'agent', content: 'I am analyzing your query with our secure neural engine. This is a simulated response for the mobile patient companion.' }]);
        }, 1000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
            <header style={{ textAlign: 'center', padding: '1rem 0' }}>
                <h1 className="gradient-text">Health AI</h1>
                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>End-to-End Encrypted Support</p>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ 
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '1rem',
                        borderRadius: '1rem',
                        background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        fontSize: '0.9rem',
                        border: m.role === 'user' ? 'none' : '1px solid var(--card-border)'
                    }}>
                        {m.content}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', paddingBottom: '1rem' }}>
                <input 
                    style={{ borderRadius: '2rem' }} 
                    placeholder="Ask about your rewards or data..." 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <button className="action-btn" style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🚀
                </button>
            </form>
        </div>
    );
}
