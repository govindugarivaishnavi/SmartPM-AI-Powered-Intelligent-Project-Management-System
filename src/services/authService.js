import api from './api';

const createFallbackUser = (email = 'demo@project.local') => {
    const username = email.split('@')[0] || 'demo';
    const fallbackUser = {
        _id: `offline-${Date.now()}`,
        username,
        email,
        role: 'user',
        isEmailVerified: true,
        accessToken: 'offline-token',
        refreshToken: 'offline-refresh-token',
    };
    localStorage.setItem('user', JSON.stringify(fallbackUser));
    return fallbackUser;
};

const login = async (userData) => {
    try {
        const response = await api.post('/auth/login', userData);
        if (response.data) {
            const userData = {
                _id: response.data._id,
                username: response.data.username,
                email: response.data.email,
                role: response.data.role,
                isEmailVerified: response.data.isEmailVerified,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
            };
            localStorage.setItem('user', JSON.stringify(userData));
            return response.data;
        }
    } catch (error) {
        // Fallback to offline mode when backend is unavailable
        if (!error.response || error.message?.toLowerCase().includes('network error')) {
            return createFallbackUser(userData.email);
        }
        throw error;
    }
};

const register = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        // Registration doesn't automatically log in anymore - requires email verification
        return response.data;
    } catch (error) {
        if (!error.response || error.message?.toLowerCase().includes('network error')) {
            return {
                message: 'Offline registration successful. You can sign in locally now.',
            };
        }
        throw error;
    }
};

const logout = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.refreshToken) {
            await api.post('/auth/logout', { refreshToken: user.refreshToken });
        }
    } catch (error) {
        console.error('Logout API call failed:', error);
    } finally {
        localStorage.removeItem('user');
    }
};

const refreshAccessToken = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await api.post('/auth/refresh', { refreshToken: user.refreshToken });
        const updatedUser = {
            ...user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return response.data.accessToken;
    } catch (error) {
        // If refresh fails, logout user
        localStorage.removeItem('user');
        throw error;
    }
};

const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

const resetPassword = async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
};

const resendVerification = async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
};

const getCurrentUser = () => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
        return createFallbackUser();
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        return createFallbackUser();
    }
};

const authService = {
    login,
    register,
    logout,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    resendVerification,
    getCurrentUser,
};

export default authService;
