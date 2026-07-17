import axios from 'axios';
import { getToken, getRefreshToken, updateAccessToken, clearSession } from '@/lib/auth';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:8080', // Point to Spring Boot
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

    // Handle 403 Forbidden - do not redirect to login, show access denied toast
    if (error.response?.status === 403) {
      toast.error(error.response.data?.message || "Access Denied: You do not have permission to perform this action.");
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      return new Promise(function (resolve, reject) {
        axios
          .post('http://localhost:8080/api/auth/refresh-token', { refreshToken })
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
            clearSession();
            window.location.href = '/login';
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