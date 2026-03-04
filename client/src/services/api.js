import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - แนบ Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - จัดการ 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Molds
export const moldsAPI = {
  getAll: (params) => api.get('/molds', { params }),
  getOne: (id) => api.get(`/molds/${id}`),
  create: (data) => api.post('/molds', data),
  update: (id, data) => api.put(`/molds/${id}`, data),
  delete: (id) => api.delete(`/molds/${id}`),
  addHistory: (id, data) => api.post(`/molds/${id}/history`, data),
};

// Maintenance
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getOne: (id) => api.get(`/maintenance/${id}`),
  create: (formData) => api.post('/maintenance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  uploadImages: (id, formData) => api.post(`/maintenance/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Work Orders
export const workOrdersAPI = {
  getAll: (params) => api.get('/work-orders', { params }),
  getOne: (id) => api.get(`/work-orders/${id}`),
  create: (data) => api.post('/work-orders', data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
  delete: (id) => api.delete(`/work-orders/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentMaintenance: () => api.get('/dashboard/recent-maintenance'),
  getRecentWorkOrders: () => api.get('/dashboard/recent-work-orders'),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Inventory
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  stockIn: (id, data) => api.post(`/inventory/${id}/stock-in`, data),
  stockOut: (id, data) => api.post(`/inventory/${id}/stock-out`, data),
  getHistory: () => api.get('/inventory/history'),
};

export default api;
