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
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/organizations${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  suspend: async (id) => {
    const response = await api.patch(`/organizations/${id}/suspend`);
    return response.data;
  },

  activate: async (id) => {
    const response = await api.patch(`/organizations/${id}/activate`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },
};

export const userService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/users${queryString ? '?' + queryString : ''}`);
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

  suspend: async (id) => {
    const response = await api.patch(`/users/${id}/suspend`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

export const ambulanceService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/ambulances${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getMyAmbulances: async () => {
    const response = await api.get('/ambulances/my-ambulances');
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

  assignUser: async (id, userId) => {
    const response = await api.post(`/ambulances/${id}/assign`, { userId });
    return response.data;
  },

  unassignUser: async (id, userId) => {
    const response = await api.delete(`/ambulances/${id}/unassign/${userId}`);
    return response.data;
  },

  getAssignedUsers: async (id) => {
    const response = await api.get(`/ambulances/${id}/assigned-users`);
    return response.data;
  },

  updateLocation: async (id, latitude, longitude) => {
    const response = await api.post(`/ambulances/${id}/location`, { latitude, longitude });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/ambulances/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/ambulances/${id}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/ambulances/${id}`);
    return response.data;
  },
};

export const patientService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/patients${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/patients', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },

  hideData: async (id) => {
    const response = await api.patch(`/patients/${id}/hide-data`);
    return response.data;
  },

  unhideData: async (id) => {
    const response = await api.patch(`/patients/${id}/unhide-data`);
    return response.data;
  },

  onboard: async (patientId, data) => {
    const response = await api.post(`/patients/${patientId}/onboard`, data);
    return response.data;
  },

  offboard: async (sessionId, data) => {
    const response = await api.patch(`/patients/sessions/${sessionId}/offboard`, data);
    return response.data;
  },

  getSessions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/patients/sessions${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await api.get(`/patients/sessions/${sessionId}`);
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

  getByCode: async (code) => {
    const response = await api.get(`/patients/code/${code}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
};

export const collaborationService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/collaborations${queryString ? '?' + queryString : ''}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/collaborations', data);
    return response.data;
  },

  accept: async (id, responseMessage) => {
    const response = await api.patch(`/collaborations/${id}/accept`, { responseMessage });
    return response.data;
  },

  reject: async (id, responseMessage) => {
    const response = await api.patch(`/collaborations/${id}/reject`, { responseMessage });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.patch(`/collaborations/${id}/cancel`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/collaborations/${id}`);
    return response.data;
  },
};
