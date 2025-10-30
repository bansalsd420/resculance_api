import api from '../utils/api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: () => {
    localStorage.clear();
  },
};

export const organizationService = {
  getAll: async () => {
    const response = await api.get('/organizations');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },
};

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.patch(`/users/${id}/approve`);
    return response.data;
  },

  reject: async (id) => {
    const response = await api.patch(`/users/${id}/reject`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

export const ambulanceService = {
  getAll: async () => {
    const response = await api.get('/ambulances');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/ambulances', data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.patch(`/ambulances/${id}/approve`);
    return response.data;
  },

  assignStaff: async (id, data) => {
    const response = await api.post(`/ambulances/${id}/assign-staff`, data);
    return response.data;
  },

  updateLocation: async (id, latitude, longitude) => {
    const response = await api.patch(`/ambulances/${id}/location`, { latitude, longitude });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/ambulances/${id}/status`, { status });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/ambulances/${id}`);
    return response.data;
  },
};

export const patientService = {
  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/patients', data);
    return response.data;
  },

  onboard: async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/onboard`, data);
    return response.data;
  },

  addVitalSigns: async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/vital-signs`, data);
    return response.data;
  },

  getVitalSigns: async (patientId, limit = 20) => {
    const response = await api.get(`/patients/${patientId}/vital-signs?limit=${limit}`);
    return response.data;
  },

  addCommunication: async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/communications`, data);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
};

export const collaborationService = {
  getAll: async () => {
    const response = await api.get('/collaborations');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/collaborations', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/collaborations/${id}/status`, { status });
    return response.data;
  },

  assignAmbulance: async (id, ambulanceId) => {
    const response = await api.patch(`/collaborations/${id}/assign-ambulance`, { ambulanceId });
    return response.data;
  },
};
