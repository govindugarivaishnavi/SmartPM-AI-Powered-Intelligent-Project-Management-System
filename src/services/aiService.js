import api from './api';

const generateAIContent = async (prompt, type) => {
    const response = await api.post('/ai/generate', { prompt, type });
    return response.data;
};

const aiService = {
    generateAIContent,
};

export default aiService;
