import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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
        const response = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
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
    
    return Promise.reject(error);
  }
);

export default api;
