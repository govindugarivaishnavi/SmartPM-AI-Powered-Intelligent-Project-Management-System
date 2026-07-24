import api from './api';

const getTasks = async (projectId) => {
    const response = await api.get(`/tasks/${projectId}`);
    return response.data;
};

const getAllTasks = async () => {
    const response = await api.get('/tasks');
    return response.data;
};

const createTask = async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
};

const updateTask = async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
};

const deleteTask = async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
};

const taskService = {
    getTasks,
    getAllTasks,
    createTask,
    updateTask,
    deleteTask,
};

export default taskService;
