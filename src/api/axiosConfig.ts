import axios from 'axios';
import { logAppError } from '../utils/errorLogger';
import {
  saveOfflineGetCache,
  loadOfflineGetCache,
  enqueueOfflineMutation,
} from '../utils/offlineQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

function buildCacheKey(config: any): string {
  const tenantId = localStorage.getItem('active_tenant_id') || 'default';
  const url = config?.url || '';
  const params = config?.params ? JSON.stringify(config.params) : '';
  return `${tenantId}:${url}:${params}`;
}

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
  (response) => {
    // Guardar en caché local todas las lecturas GET exitosas para contingencia Offline
    const method = (response.config?.method || 'get').toLowerCase();
    if (method === 'get' && response.config?.url && response.config.responseType !== 'blob') {
      saveOfflineGetCache(buildCacheKey(response.config), response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ── 1. Manejo de Sesión Única (SESSION_SUPERSEDED) ────────────────────────
    const isSuperseded =
      typeof error.response?.data?.detail === 'string' &&
      error.response.data.detail.includes('SESSION_SUPERSEDED');

    if (isSuperseded) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('active_tenant_id');
      localStorage.removeItem('active_tenant_name');
      sessionStorage.removeItem('session_active');
      window.location.href = '/login?reason=session_superseded';
      return Promise.reject(error);
    }

    // ── 2. Renovación Automática de Token (401) ───────────────────────────────
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login'
    ) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (!refresh_token) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token,
        });

        const { access_token, refresh_token: new_refresh_token } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', new_refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        if (!refreshError.response) {
          // Si falló el refresh porque se fue el internet, NO cerrar la sesión del usuario
          return Promise.reject(error);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('active_tenant_id');
        localStorage.removeItem('active_tenant_name');
        sessionStorage.removeItem('session_active');
        const refreshSuperseded =
          typeof refreshError.response?.data?.detail === 'string' &&
          refreshError.response.data.detail.includes('SESSION_SUPERSEDED');
        window.location.href = refreshSuperseded
          ? '/login?reason=session_superseded'
          : '/login';
        return Promise.reject(refreshError);
      }
    }

    // ── 3. Resiliencia Universal Offline (Cuando falla el Internet) ───────────
    const isNetworkFailure = !error.response && Boolean(originalRequest);
    if (isNetworkFailure) {
      const method = (originalRequest.method || 'get').toLowerCase();
      const url = originalRequest.url || '';
      const bypassQueue = originalRequest.headers?.['X-Bypass-Offline-Queue'] === '1';

      // A) Si es una lectura GET, responder desde el caché local para no interrumpir la pantalla
      if (method === 'get') {
        const cached = loadOfflineGetCache(buildCacheKey(originalRequest));
        if (cached !== null) {
          return Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK (Offline Cache)',
            headers: {},
            config: originalRequest,
            _fromOfflineCache: true,
          });
        }
      }

      // B) Si es una escritura (POST, PUT, PATCH, DELETE) fuera de login/logs, encolarla automáticamente
      const isExcludedUrl =
        url.includes('/auth/') ||
        url.includes('/support/error-logs') ||
        url.includes('/digital-invoice/test-connection');

      // Nota: /sales/ desde POSPage ya tiene su propio manejador en onError, pero si viene de otro módulo
      // o si no es /sales/, lo encolamos en el motor universal para que nada se pierda.
      if (
        !bypassQueue &&
        !isExcludedUrl &&
        ['post', 'put', 'patch', 'delete'].includes(method) &&
        url !== '/sales/'
      ) {
        let parsedBody: any = {};
        try {
          parsedBody =
            typeof originalRequest.data === 'string'
              ? JSON.parse(originalRequest.data)
              : originalRequest.data || {};
        } catch {
          parsedBody = {};
        }

        const queued = enqueueOfflineMutation(method, url, parsedBody);
        return Promise.resolve({
          data: {
            id: Date.now(),
            ...parsedBody,
            _offline_queued: true,
            _offline_id: queued.id,
            status: 'OFFLINE_QUEUED',
            message:
              'Guardado en Modo Contingencia Offline. Se enviará automáticamente a la Base de Datos al restablecerse el internet.',
          },
          status: 200,
          statusText: 'OK (Queued Offline)',
          headers: {},
          config: originalRequest,
        });
      }
    }

    if (
      error.config &&
      !error.config.url?.includes('/support/error-logs') &&
      error.response?.status >= 500
    ) {
      const msg = `API Failure: ${error.response?.status} on ${error.config.method?.toUpperCase()} ${error.config.url}`;
      const stackDetails = JSON.stringify({
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      logAppError(msg, stackDetails, 'Axios Interceptor');
    }

    return Promise.reject(error);
  }
);

export default api;
