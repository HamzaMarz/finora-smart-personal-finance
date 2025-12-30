
import axios from 'axios';

// Base URL for the backend API (using Vite proxy)
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('finora-auth');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        console.error('Error parsing auth state', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling & Network Error Detection
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Auth Expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('finora-auth');
      // Only redirect if we're not already on the login page
      if (!window.location.hash.includes('/login')) {
        window.location.href = '#/login';
      }
    }

    // 2. Handle Network Errors (Server down or CORS)
    if (!error.response) {
      return Promise.reject(new Error('NETWORK_ERROR'));
    }

    // 3. Normalize backend error messages
    const message = error.response?.data?.error || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
