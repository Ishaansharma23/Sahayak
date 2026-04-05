import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if using localStorage instead of cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  updateLocation: (data) => api.put('/auth/location', data),
};

// Hospital API
export const hospitalAPI = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  getNearby: (params) => api.get('/hospitals/nearby', { params }),
  create: (data) => api.post('/hospitals', data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  delete: (id) => api.delete(`/hospitals/${id}`),
  updateBeds: (id, data) => api.put(`/hospitals/${id}/beds`, data),
  updateAmbulances: (id, data) => api.put(`/hospitals/${id}/ambulances`, data),
  getStats: (id) => api.get(`/hospitals/${id}/stats`),
};

// Doctor API
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getNearby: (params) => api.get('/doctors/nearby', { params }),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
  updateAvailability: (id, data) => api.put(`/doctors/${id}/availability`, data),
  getSchedule: (id, params) => api.get(`/doctors/${id}/schedule`, { params }),
};

// Emergency API
export const emergencyAPI = {
  getAll: (params) => api.get('/emergency', { params }),
  getById: (id) => api.get(`/emergency/${id}`),
  create: (data) => api.post('/emergency', data),
  update: (id, data) => api.put(`/emergency/${id}`, data),
  updateStatus: (id, data) => api.put(`/emergency/${id}/status`, data),
  assignAmbulance: (id, data) => api.put(`/emergency/${id}/assign`, data),
  getMyEmergencies: () => api.get('/emergency/my'),
  getActive: () => api.get('/emergency/active'),
};

// SOS API
export const sosAPI = {
  trigger: (data) => api.post('/sos', data),
  getActive: () => api.get('/sos/active'),
  getById: (id) => api.get(`/sos/${id}`),
  updateStatus: (id, data) => api.put(`/sos/${id}/status`, data),
  respond: (id, data) => api.post(`/sos/${id}/respond`, data),
  getMy: () => api.get('/sos/my'),
  getNearby: (params) => api.get('/sos/nearby', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getHospitals: (params) => api.get('/admin/hospitals', { params }),
  verifyHospital: (id, data) => api.put(`/admin/hospitals/${id}/verify`, data),
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  verifyDoctor: (id, data) => api.put(`/admin/doctors/${id}/verify`, data),
  getEmergencies: (params) => api.get('/admin/emergencies', { params }),
  getSOSAlerts: (params) => api.get('/admin/sos', { params }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
};

export default api;
