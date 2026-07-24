import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await forgotPassword(email);
            setSuccess('If an account with that email exists, a password reset link has been sent.');
        } catch (err) {
            setError('Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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

                <h1 style={styles.title}>Reset Password</h1>
                <p style={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</p>

                {error && (
                    <div style={styles.errorBox}>
                        <span style={styles.errorDot}></span>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={styles.successBox}>
                        <span style={styles.successDot}></span>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>EMAIL ADDRESS</label>
                        <div style={styles.inputWrap}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                type="email"
                                required
                                style={styles.input}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => { if (!loading) e.target.style.background = '#0369a1'; }}
                        onMouseLeave={(e) => { if (!loading) e.target.style.background = '#0284c7'; }}
                    >
                        {loading ? (
                            <span style={styles.spinnerWrap}>
                                <span style={styles.spinner}></span>
                                Sending...
                            </span>
                        ) : (
                            <span style={styles.btnContent}>
                                Send Reset Link
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                            </span>
                        )}
                    </button>
                </form>

                <p style={styles.switchText}>
                    Remember your password?{' '}
                    <Link to="/login" style={styles.link}>Sign in</Link>
                </p>
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
        textAlign: 'center',
        color: '#0f172a',
        margin: '0 0 8px 0',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        fontSize: '14px',
        color: '#64748b',
        textAlign: 'center',
        margin: '0 0 32px 0',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#fff1f2',
        border: '1px solid #fecdd3',
        color: '#e11d48',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        marginBottom: '24px',
    },
    errorDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#e11d48',
        flexShrink: 0,
    },
    successBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        marginBottom: '24px',
    },
    successDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#166534',
        flexShrink: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#374151',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    inputWrap: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
    },
    input: {
        width: '100%',
        padding: '14px 14px 14px 44px',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '16px',
        background: '#ffffff',
        transition: 'border-color 0.2s',
        outline: 'none',
    },
    button: {
        width: '100%',
        padding: '14px 24px',
        background: '#0284c7',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    spinnerWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid #ffffff',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    btnContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    switchText: {
        textAlign: 'center',
        fontSize: '14px',
        color: '#64748b',
        marginTop: '24px',
    },
    link: {
        color: '#0284c7',
        textDecoration: 'none',
        fontWeight: '600',
    },
};

export default ForgotPassword;