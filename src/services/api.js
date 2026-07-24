import axios from 'axios';
import authService from './authService';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add access token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.accessToken) {
            config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const newAccessToken = await authService.refreshAccessToken();

                // Update the authorization header
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login
                const currentPath = window.location.pathname;
                const isOnAuthPage = currentPath === '/login' || currentPath === '/register' ||
                                   currentPath.startsWith('/verify-email') ||
                                   currentPath.startsWith('/reset-password') ||
                                   currentPath === '/forgot-password';

                if (!isOnAuthPage) {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle other auth-related errors
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            const isAuthEndpoint = requestUrl.includes('/auth/');

            if (!isAuthEndpoint) {
                const currentPath = window.location.pathname;
                const isOnAuthPage = currentPath === '/login' || currentPath === '/register' ||
                                   currentPath.startsWith('/verify-email') ||
                                   currentPath.startsWith('/reset-password') ||
                                   currentPath === '/forgot-password';

                if (!isOnAuthPage) {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
