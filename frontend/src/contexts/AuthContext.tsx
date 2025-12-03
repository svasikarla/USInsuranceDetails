import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import { NavigationGuard } from '../utils/navigationGuard';
import { ACCESS_TOKEN_KEY } from '../services/apiClient';

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
    let mounted = true;

    const init = async () => {
      try {
        await checkAuth();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.debug('Auth check: failed to fetch user');
        setUser(null);
        // Optionally, logout to clear invalid tokens
        authService.logout();
      }
    } else {
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);

      const redirectTo = (router.query.redirect as string) || '/dashboard';
      await NavigationGuard.safeReplace(router, redirectTo);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await authService.register(userData);
      setUser(response);

      // After registration, log the user in to get tokens
      await login(userData.email, userData.password);
    } finally {
      setLoading(false);
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
