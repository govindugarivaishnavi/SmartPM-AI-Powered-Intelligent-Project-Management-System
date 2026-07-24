import api from './api';

const getNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

const markAsRead = async (id) => {
    const response = await api.put(`/notifications/${id}`);
    return response.data;
};

const clearNotifications = async () => {
    const response = await api.delete('/notifications');
    return response.data;
};

const notificationService = {
    getNotifications,
    markAsRead,
    clearNotifications,
};

export default notificationService;
