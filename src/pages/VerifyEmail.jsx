import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await api.get(`/auth/verify/${token}`);
                setStatus('success');
                setMessage('Email verified successfully! You can now log in.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoWrap}>
                    <div style={styles.logo}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </div>
                </div>

                <h1 style={styles.title}>
                    {status === 'verifying' && 'Verifying Email'}
                    {status === 'success' && 'Email Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h1>

                <div style={styles.statusBox}>
                    {status === 'verifying' && (
                        <div style={styles.loading}>
                            <div style={styles.spinner}></div>
                            <p>Verifying your email address...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={styles.success}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            <p>{message}</p>
                            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                                Redirecting to login page...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={styles.error}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            <p>{message}</p>
                            <div style={{ marginTop: '16px' }}>
                                <Link to="/login" style={styles.link}>Go to Login</Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
        padding: '20px',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    card: {
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(2, 132, 199, 0.12), 0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid #e0f2fe',
        animation: 'fadeUp 0.4s ease',
        textAlign: 'center',
    },
    logoWrap: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px',
    },
    logo: {
        width: '56px',
        height: '56px',
        background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#0f172a',
        margin: '0 0 32px 0',
        letterSpacing: '-0.5px',
    },
    statusBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #0284c7',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    success: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    error: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    link: {
        color: '#0284c7',
        textDecoration: 'none',
        fontWeight: '600',
        padding: '8px 16px',
        border: '1px solid #0284c7',
        borderRadius: '8px',
        transition: 'all 0.2s',
    },
};

export default VerifyEmail;