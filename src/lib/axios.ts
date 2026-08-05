import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://projector-flatness-grappling.ngrok-free.dev/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 10000,
});

// Request interceptor to attach bearer token if available
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wellness_admin_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for clean error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Warning:', error?.response?.data || error?.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;


