import axios from 'axios';

// Mengambil URL dari environment atau default ke localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Middleware untuk menyisipkan Token otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- API Auth ---
export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  getPublicKey: () => api.get('/auth/public-key'),
};

// --- API Medical History (WAJIB ADA) ---
// Error terjadi karena bagian ini mungkin belum ada di file Anda
export const medicalApi = {
  getHistory: () => api.get('/medical-history'),
  addHistory: (data: any) => api.post('/medical-history', data),
  deleteHistory: (id: string) => api.delete(`/medical-history/${id}`),
};

export default api;