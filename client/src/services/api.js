import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for sending httpOnly refresh token cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach access token from localStorage (if stored there)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

// Clear any orphaned refresh lock from a previous session crash on startup
localStorage.removeItem('auth_refresh_in_progress');

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Response interceptor: Handle automatic token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if the refresh token request itself fails
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      
      // 1. Same-tab queuing: if a refresh is already in progress in this context, queue the request in memory
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // 2. Multi-tab synchronization: check if another tab is currently refreshing
      let retries = 0;
      while (localStorage.getItem('auth_refresh_in_progress') === 'true' && retries < 10) {
        await sleep(500);
        retries++;

        // If the other tab finished and updated the access token, retry request with the new token
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken && originalRequest.headers.Authorization !== `Bearer ${currentToken}`) {
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          return api(originalRequest);
        }
      }

      // Double-check if another request in this tab initiated refresh while we were sleeping
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      localStorage.setItem('auth_refresh_in_progress', 'true');

      try {
        // Request a new access token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Resolve all queued requests with the new token
        processQueue(null, accessToken);

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Reject all queued requests if the refresh fails
        processQueue(refreshError, null);
        
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        localStorage.removeItem('auth_refresh_in_progress');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
