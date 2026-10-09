import axios from 'axios';
import { config } from '../config';

export const api = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('haivoly_web_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('haivoly_web_token');
    }
    return Promise.reject(err);
  },
);

// Actions
export async function getActions(params?: Record<string, string | number>) {
  const res = await api.get('/actions', { params });
  return res.data;
}
export async function getAction(id: string) {
  const res = await api.get(`/actions/${id}`);
  return res.data;
}
export async function getDashboardStats() {
  const res = await api.get('/actions/stats/dashboard');
  return res.data;
}
export async function syncActions(actions: unknown[]) {
  const res = await api.post('/actions/batch-sync', { actions });
  return res.data;
}

// Recommendations
export async function getRecommendations(params?: Record<string, string | number>) {
  const res = await api.get('/recommendations', { params });
  return res.data;
}
export async function createRecommendation(data: unknown) {
  const res = await api.post('/recommendations', data);
  return res.data;
}
export async function markRecommendationRead(id: string) {
  const res = await api.patch(`/recommendations/${id}/read`);
  return res.data;
}
export async function deleteRecommendation(id: string) {
  const res = await api.delete(`/recommendations/${id}`);
  return res.data;
}

// Auth (reuse backend auth)
export async function loginWeb(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data as { access_token: string; utilisateur: unknown };
}
