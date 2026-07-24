import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.username.trim().length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            await register(formData);
            // Show success message and redirect to login
            setError('Registration successful! Please check your email to verify your account.');
            setTimeout(() => {
                navigate('/login', { state: { email: formData.email, message: 'Please check your email to verify your account before logging in.' } });
            }, 2000);
        } catch (err) {
            const msg = err?.response?.data?.message
                || err?.message
                || 'Failed to register. Please try again.';
            setError(msg);
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

                <h1 style={styles.title}>Join SmartPM</h1>
                <p style={styles.subtitle}>Create your AI-powered workspace today</p>

                {error && (
                    <div style={styles.errorBox}>
                        <span style={styles.errorDot}></span>
                        <span>
                            {error}
                            {error.toLowerCase().includes('already exists') && (
                                <span> — <Link to="/login" style={{ color: '#e11d48', fontWeight: '700', textDecoration: 'underline' }}>Sign in instead</Link></span>
                            )}
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Username */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>USERNAME</label>
                        <div style={styles.inputWrap}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                id="register-username"
                                type="text"
                                required
                                style={styles.input}
                                placeholder="alex_rivers"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>EMAIL ADDRESS</label>
                        <div style={styles.inputWrap}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                id="register-email"
                                type="email"
                                required
                                style={styles.input}
                                placeholder="alex@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>PASSWORD</label>
                        <div style={styles.inputWrap}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                id="register-password"
                                type="password"
                                required
                                style={styles.input}
                                placeholder="Min. 6 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                        {formData.password.length > 0 && (
                            <div style={styles.strengthBar}>
                                <div style={{
                                    ...styles.strengthFill,
                                    width: formData.password.length >= 10 ? '100%' : formData.password.length >= 6 ? '60%' : '25%',
                                    background: formData.password.length >= 10 ? '#16a34a' : formData.password.length >= 6 ? '#ca8a04' : '#e11d48',
                                }} />
                            </div>
                        )}
                        {formData.password.length > 0 && (
                            <span style={{ fontSize: '12px', color: formData.password.length >= 6 ? '#16a34a' : '#e11d48' }}>
                                {formData.password.length >= 10 ? '✓ Strong password' : formData.password.length >= 6 ? '⚠ Good password' : '✗ Too short (min 6 chars)'}
                            </span>
                        )}
                    </div>

                    <button
                        id="register-submit"
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#0369a1'; }}
                        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#0284c7'; }}
                    >
                        {loading ? (
                            <span style={styles.spinnerWrap}>
                                <span style={styles.spinner}></span>
                                Creating Account...
                            </span>
                        ) : (
                            <span style={styles.btnContent}>
                                Get Started Free
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </span>
                        )}
                    </button>
                </form>

                <div style={styles.divider}>
                    <span style={styles.dividerLine}></span>
                    <span style={styles.dividerText}>Already have an account?</span>
                    <span style={styles.dividerLine}></span>
                </div>

                <p style={styles.switchText}>
                    <Link to="/login" style={styles.link}>Sign In Instead</Link>
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
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.08em',
        color: '#64748b',
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
        paddingLeft: '44px',
        paddingRight: '16px',
        paddingTop: '13px',
        paddingBottom: '13px',
        fontSize: '15px',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        outline: 'none',
        color: '#0f172a',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    strengthBar: {
        height: '4px',
        background: '#f1f5f9',
        borderRadius: '2px',
        overflow: 'hidden',
        marginTop: '2px',
    },
    strengthFill: {
        height: '100%',
        borderRadius: '2px',
        transition: 'width 0.3s, background 0.3s',
    },
    button: {
        width: '100%',
        padding: '14px',
        background: '#0284c7',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '700',
        transition: 'background 0.2s, transform 0.1s',
        boxShadow: '0 4px 16px rgba(2, 132, 199, 0.3)',
        marginTop: '4px',
        fontFamily: "'Inter', system-ui, sans-serif",
    },
    btnContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    spinnerWrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },
    spinner: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '28px 0 16px 0',
    },
    dividerLine: {
        flex: 1,
        height: '1px',
        background: '#e2e8f0',
    },
    dividerText: {
        fontSize: '13px',
        color: '#94a3b8',
        whiteSpace: 'nowrap',
    },
    switchText: {
        textAlign: 'center',
        fontSize: '14px',
        margin: 0,
    },
    link: {
        color: '#0284c7',
        fontWeight: '700',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
    },
};

export default Register;
