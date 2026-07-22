import axios from 'axios';
import { getToken, getRefreshToken, updateAccessToken, clearSession } from '@/lib/auth';
import { toast } from 'sonner';

// API base URL is environment-driven (set VITE_API_URL in .env for each deployment);
// defaults to the local Spring Boot server for development.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      if (config.headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 Forbidden - reject silently without popping toast for background requests
    if (error.response?.status === 403) {
      return Promise.reject(error);
    }

    // Never attempt a token refresh for auth endpoints (login/refresh failures are
    // real credential errors, not expired sessions).
    const isAuthEndpoint = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/api/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.set('Authorization', 'Bearer ' + token);
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return Promise.reject(error);
      }

      return new Promise(function (resolve, reject) {
        axios
          .post(`${API_BASE_URL}/api/auth/refresh-token`, { refreshToken })
          .then(({ data }) => {
            updateAccessToken(data.accessToken);
            api.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
            if (originalRequest.headers) {
              originalRequest.headers.set('Authorization', 'Bearer ' + data.accessToken);
            }
            processQueue(null, data.accessToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;