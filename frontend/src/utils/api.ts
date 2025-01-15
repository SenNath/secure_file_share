import axios from 'axios';
import { store } from '../store';
import { logout, refreshTokenSuccess, refreshTokenStart, refreshTokenFailure } from '../store/slices/authSlice';
import type { AuthResponse } from '../store/slices/authSlice';

// Create axios instance with custom config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 and token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        store.dispatch(refreshTokenStart());
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;
        
        if (!refreshToken) {
          store.dispatch(refreshTokenFailure('No refresh token available'));
          return Promise.reject(error);
        }

        const response = await api.post<AuthResponse>('/api/auth/refresh/', {
          refresh_token: refreshToken
        });

        store.dispatch(refreshTokenSuccess(response.data));

        // Update the original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        // Retry the original request
        return api.request(originalRequest);
      } catch (refreshError) {
        store.dispatch(refreshTokenFailure('Token refresh failed'));
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 