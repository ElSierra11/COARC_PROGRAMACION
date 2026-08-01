import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('coarc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const arbitrosService = {
  getArbitros: async () => {
    const response = await api.get('/arbitros/');
    return response.data;
  },
  createArbitro: async (data) => {
    const response = await api.post('/arbitros/', data);
    return response.data;
  },
  registerArbitro: async (data) => {
    // Upsert: crea si no existe, devuelve el existente si ya está registrado
    const response = await api.post('/arbitros/register', data);
    return response.data;
  },
  updateArbitro: async (id, data) => {
    const response = await api.put(`/arbitros/${id}`, data);
    return response.data;
  },
  deleteArbitro: async (id) => {
    const response = await api.delete(`/arbitros/${id}`);
    return response.data;
  }
};

export const designacionesService = {
  getDesignaciones: async (params) => {
    const response = await api.get('/designaciones/', { params });
    return response.data;
  },
  createDesignacion: async (data) => {
    const response = await api.post('/designaciones/', data);
    return response.data;
  },
  updateDesignacion: async (id, data) => {
    const response = await api.put(`/designaciones/${id}`, data);
    return response.data;
  },
  deleteDesignacion: async (id) => {
    const response = await api.delete(`/designaciones/${id}`);
    return response.data;
  },
  getArbitrosStats: async (fecha_iso) => {
    const response = await api.get('/designaciones/stats/arbitros', { params: { fecha_iso } });
    return response.data;
  }
};

export default api;
