import axios from 'axios';
import { logAppError } from '../utils/errorLogger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add X-Tenant-ID header if switching branches
  const activeTenantId = localStorage.getItem('active_tenant_id');
  if (activeTenantId) {
    config.headers['X-Tenant-ID'] = activeTenantId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      
      try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (!refresh_token) {
          throw new Error('No refresh token available');
        }
        
        // Call the refresh endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token
        });
        
        const { access_token, refresh_token: new_refresh_token } = response.data;
        
        // Save new tokens
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', new_refresh_token);
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('active_tenant_id');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    if (error.config && !error.config.url?.includes('/support/error-logs') && (error.response?.status >= 500 || !error.response)) {
      const msg = `API Failure: ${error.response?.status || 'Network Error'} on ${error.config.method?.toUpperCase()} ${error.config.url}`;
      const stackDetails = JSON.stringify({
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      logAppError(msg, stackDetails, 'Axios Interceptor');
    }
    
    return Promise.reject(error);
  }
);

export default api;
