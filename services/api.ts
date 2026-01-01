
import axios from 'axios';

// Base URL for the backend API (using Vite proxy)
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
      // Check if we are in demo mode (client-side specific token)
      const authStorage = localStorage.getItem('finora-auth');
      let isDemo = false;
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          if (state.token === 'demo-token') isDemo = true;
        } catch (e) { }
      }

      // If it's NOT a demo session, clear auth and redirect.
      // If it IS a demo session, the server rejected the 'demo-token' (expected),
      // but we shouldn't logout the user locally. Instead, services should mock response.
      if (!isDemo) {
        localStorage.removeItem('finora-auth');
        if (!window.location.hash.includes('/login')) {
          window.location.href = '#/login';
        }
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
