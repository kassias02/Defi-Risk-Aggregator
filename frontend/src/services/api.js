// frontend/src/services/api.js
import axios from 'axios';
import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter le token aux requêtes protégées
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchProtocols = () => api.get('/protocols').then(res => res.data);
export const fetchUserPortfolio = (userId) => api.get(`/portfolio/user/${userId}`).then(res => res.data);
export const fetchPortfolioRisk = (portfolio) => api.post('/portfolio/analyze', { portfolio }).then(res => res.data);
export const optimizePortfolio = (options) => api.post('/portfolio/optimize', options).then(res => res.data);
export const updateAlertSettings = (settings) => api.put('/user/alerts', { alertSettings: settings }).then(res => res.data);

export default api;