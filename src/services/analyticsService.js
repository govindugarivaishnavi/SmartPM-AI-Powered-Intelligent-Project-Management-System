import api from './api';

const getDashboardStats = async () => {
    const response = await api.get('/analytics/stats');
    return response.data;
};

const analyticsService = {
    getDashboardStats,
};

export default analyticsService;
