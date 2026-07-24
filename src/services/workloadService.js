import api from './api';

const getWorkload = async () => {
  const response = await api.get('/workload');
  return response.data;
};

const workloadService = {
  getWorkload,
};

export default workloadService;
