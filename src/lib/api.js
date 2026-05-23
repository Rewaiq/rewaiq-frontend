import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://rewaiq-backend-production.up.railway.app';

const API = axios.create({ baseURL });

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rewaiq_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;