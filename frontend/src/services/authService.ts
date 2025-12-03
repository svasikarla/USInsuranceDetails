import { AxiosResponse } from 'axios';
import { User, RegisterData } from '../contexts/AuthContext';
import { apiClient, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './apiClient';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    const response: AxiosResponse<LoginResponse> = await apiClient.post(
      '/api/auth/login',
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token } = response.data;
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);

    return response.data;
  },

  async register(userData: RegisterData): Promise<User> {
    const response: AxiosResponse<User> = await apiClient.post(
      '/api/auth/register',
      userData
    );
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await apiClient.get('/api/users/me');
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    }
  },
};

export default authService;
