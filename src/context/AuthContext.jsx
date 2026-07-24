import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (userData) => {
        const data = await authService.login(userData);
        setUser(data);
        return data;
    };

    const register = async (userData) => {
        const data = await authService.register(userData);
        // Registration doesn't log in automatically anymore
        return data;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const refreshToken = async () => {
        try {
            const newToken = await authService.refreshAccessToken();
            const updatedUser = { ...user, accessToken: newToken };
            setUser(updatedUser);
            return newToken;
        } catch (error) {
            // If refresh fails, logout
            setUser(null);
            throw error;
        }
    };

    const forgotPassword = async (email) => {
        return await authService.forgotPassword(email);
    };

    const resetPassword = async (token, password) => {
        return await authService.resetPassword(token, password);
    };

    const resendVerification = async (email) => {
        return await authService.resendVerification(email);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            refreshToken,
            forgotPassword,
            resetPassword,
            resendVerification
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
