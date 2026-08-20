import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wellness-backend-1-trvx.onrender.com/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  // The backend is on Render's free tier, which spins the service down after idle and takes
  // 20-50s+ to cold-start the next request — 10s was aborting every one of those as a hard
  // failure (Dashboard/Partners/etc. showing zeroed data with a "couldn't load" banner even
  // though the backend was simply still waking up). 30s covers that without making a genuinely
  // unreachable backend hang much longer than before.
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wellness_admin_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Warning:', error?.response?.data || error?.message);

    const status = error?.response?.status;
    const isLoginRequest = error?.config?.url?.includes('/admin/login');

    // A 401 means the stored token is missing/expired/invalid — the admin is effectively
    // logged out even though a (stale) token still sits in localStorage. Without this, the
    // panel keeps rendering the authenticated shell (sidebar/header) while every request
    // silently fails, so the screen just sits there empty instead of sending the admin back
    // to login. Skip the login endpoint itself so a wrong-password attempt just shows its own
    // error message instead of forcing a redirect while already on /login.
    if (status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('wellness_admin_user');
      localStorage.removeItem('wellness_admin_token');
      document.cookie = 'wellness_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;


