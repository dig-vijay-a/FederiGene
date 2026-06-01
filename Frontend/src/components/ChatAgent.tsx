// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import './ChatAgent.css';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ChatAgent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'agent', content: 'Hi there! I am the FederiGene Intelligent Assistant. How can I help you today?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<any>(null);

    const [isContactMode, setIsContactMode] = useState(false);
    const [contactSubject, setContactSubject] = useState('');
    const [contactDesc, setContactDesc] = useState('');
    const [isSendingContact, setIsSendingContact] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (!isContactMode && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen, isContactMode]);

    // Don't render the chat block if user is NOT authenticated
    if (!user) {
        return null;
    }

    const toggleChat = () => setIsOpen(!isOpen);

    const getPageContext = () => {
        // Scrape meaningful content from the page
        const mainContent = document.querySelector('main') || document.querySelector('.dashboard-content') || document.body;
        
        // Get headings, labels, and text values from inputs/cards
        const contextLines = [];
        contextLines.push(`Page Title: ${document.title}`);
        contextLines.push(`Current URL: ${window.location.pathname}`);
        
        // Extract text from cards and sections
        const sections = mainContent.querySelectorAll('.content-card, .section, h1, h2, h3, .stat-label, .stat-value');
        sections.forEach(el => {
            const text = el.innerText || el.textContent;
            if (text && text.length < 500) {
                contextLines.push(text.trim());
            }
        });

        // Extract values from inputs and selects
        const inputs = mainContent.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`)?.innerText || input.placeholder || input.name;
            if (label && input.value) {
                contextLines.push(`${label}: ${input.value}`);
            }
        });

        return contextLines.join('\n').substring(0, 4000); // Limit context size
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!contactSubject.trim() || !contactDesc.trim()) return;
        setIsSendingContact(true);
        try {
            await api.post('/chat/contact', {
                subject: contactSubject,
                description: contactDesc
            });
            showToast('Your message has been sent successfully to info@federigene.com!', 'success');
            setIsContactMode(false);
            setContactSubject('');
            setContactDesc('');
        } catch (error) {
            showToast('Failed to send message. Please try again later.', 'error');
            console.error(error);
        } finally {
            setIsSendingContact(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newUserMessage = { role: 'user', content: inputText.trim() };
        const updatedMessages = [...messages, newUserMessage];
        
        setMessages(updatedMessages);
        const currentInput = inputText.trim();
        setInputText('');
        setIsTyping(true);

        const pageContext = getPageContext();

        try {
            const res = await api.post('/chat/ask', {
                messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                context: pageContext
            });

            const agentResponse = res.data.response;
            setMessages([...updatedMessages, { role: 'agent', content: agentResponse }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages([...updatedMessages, { 
                role: 'agent', 
                content: 'Sorry, I encountered an error connecting to my neural network. Please try again later.' 
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chat-agent-wrapper">
            {isOpen && (
                <div className="chat-agent-window">
                    <div className="chat-header">
                        <h3>
                            <span className="online-dot"></span> 
                            {isContactMode ? 'Contact Support' : 'FederiGene AI'}
                        </h3>
                        <div className="header-actions" style={{display: 'flex', gap: '10px'}}>
                            <button className="header-icon-btn" onClick={() => setIsContactMode(!isContactMode)} title={isContactMode ? "Back to AI Chat" : "Contact Human Support"}>
                                {isContactMode ? '💬' : '📧'}
                            </button>
                            <button className="header-icon-btn" onClick={toggleChat} title="Close">✕</button>
                        </div>
                    </div>

                    {isContactMode ? (
                        <div className="contact-form-container">
                            <p className="contact-info-text">Send a direct message to our support team. We'll reply to <strong>{user.email}</strong>.</p>
                            <form className="contact-form" onSubmit={handleContactSubmit}>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <input 
                                        type="text" 
                                        value={contactSubject} 
                                        onChange={e => setContactSubject((e.target as any).value)} 
                                        required 
                                        placeholder="What do you need help with?" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea 
                                        value={contactDesc} 
                                        onChange={e => setContactDesc((e.target as any).value)} 
                                        required 
                                        placeholder="Provide details here..." 
                                        rows={6}
                                    ></textarea>
                                </div>
                                <button type="submit" className="contact-submit-btn" disabled={isSendingContact}>
                                    {isSendingContact ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="chat-messages">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.role}`}>
                                        {msg.content}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="typing-indicator">
                                        <div className="typing-status-text">Analyzing Context...</div>
                                        <div className="typing-dots">
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={handleSend}>
                                <input 
                                    type="text" 
                                    className="chat-input" 
                                    placeholder="Ask me anything..." 
                                    value={inputText}
                                    onChange={(e) => setInputText((e.target as any).value)}
                                    disabled={isTyping}
                                />
                                <button type="submit" className="send-btn" disabled={!inputText.trim() || isTyping}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* The Floating Toggle Button */}
            {!isOpen && (
                <button className="chat-agent-toggle" onClick={toggleChat} title="Chat with FederiGene AI">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            )}
        </div>
    );
}
