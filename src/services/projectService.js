import api from './api';

const getProjects = async () => {
    const response = await api.get('/projects');
    return response.data;
};

const getProject = async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
};

const createProject = async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
};

const updateProject = async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
};

const deleteProject = async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
};

const inviteMember = async (invitationData) => {
    const response = await api.post('/projects/invite', invitationData);
    return response.data;
};

const projectService = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    inviteMember,
};

export default projectService;
