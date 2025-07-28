import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import { NavigationGuard } from '../utils/navigationGuard';

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  role: string;
  subscription_tier: string;
  is_active: boolean;
  email_verified: boolean;
  supabase_uid?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  company_name?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      setUser(response.user);

      // Redirect to dashboard or intended page using safe navigation
      const redirectTo = router.query.redirect as string || '/dashboard';
      await NavigationGuard.safePush(router, redirectTo);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      setUser(response);

      // Redirect to dashboard after successful registration using safe navigation
      await NavigationGuard.safePush(router, '/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    NavigationGuard.safePush(router, '/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
