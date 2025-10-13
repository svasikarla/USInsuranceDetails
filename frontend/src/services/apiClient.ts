import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export const ACCESS_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
const REFRESH_TIMEOUT = 10000; // 10 seconds

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh state
let refreshTokenPromise: Promise<string> | null = null;

const handleTokenRefresh = async (): Promise<string> => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
      token: refreshToken
    });

    const { access_token, refresh_token: new_refresh_token } = response.data;

    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (new_refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, new_refresh_token);
    }

    return access_token;
  } catch (error) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    throw error;
  }
};

// Add response interceptor for token refresh
// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // Exclude login and register endpoints from token refresh logic
    if (originalRequest.url === '/api/auth/login' || originalRequest.url === '/api/auth/register') {
      return Promise.reject(error);
    }

    // Only handle 401 errors for requests that haven't been retried
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // If a token refresh is already in progress, wait for it
      if (refreshTokenPromise) {
        const token = await refreshTokenPromise;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }

      // Start a new token refresh with timeout
      refreshTokenPromise = Promise.race([
        handleTokenRefresh(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Token refresh timeout')), REFRESH_TIMEOUT)
        )
      ]);

      try {
        const newToken = await refreshTokenPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } finally {
        refreshTokenPromise = null;
      }
    } catch (refreshError) {
      // Clear tokens and redirect to login on refresh failure
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;