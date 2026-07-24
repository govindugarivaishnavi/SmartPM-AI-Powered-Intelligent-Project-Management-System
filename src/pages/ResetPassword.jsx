import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, formData.password);
            setSuccess('Password reset successfully! You can now log in with your new password.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleFocus = (e) => { e.target.style.borderColor = '#0284c7'; };
    const handleBlur = (e) => { e.target.style.borderColor = '#e2e8f0'; };

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
                <p style={styles.subtitle}>Enter your new password below.</p>

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
                        <label style={styles.label}>NEW PASSWORD</label>
                        <div style={styles.inputWrap}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type="password"
                                required
                                style={styles.input}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>CONFIRM PASSWORD</label>
                        <div style={styles.inputWrap}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type="password"
                                required
                                style={styles.input}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
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
                                Resetting...
                            </span>
                        ) : (
                            <span style={styles.btnContent}>
                                Reset Password
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 12l2 2 4-4"/>
                                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                    <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                                    <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                                </svg>
                            </span>
                        )}
                    </button>
                </form>
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
};

export default ResetPassword;