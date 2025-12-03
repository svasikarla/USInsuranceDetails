import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { NavigationGuard } from '../../utils/navigationGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireAuth = true,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && isClient) {
      if (requireAuth && !isAuthenticated) {
        // Store the current path for redirect after login
        const currentPath = router.asPath;
        NavigationGuard.safePush(router, `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      } else if (!requireAuth && isAuthenticated) {
        // Redirect authenticated users away from auth pages using safe navigation
        NavigationGuard.safePush(router, '/dashboard');
      }
    }
  }, [loading, isAuthenticated, requireAuth, router, redirectTo, isClient]);

  if (!isClient || (loading && requireAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

// Higher-order component for protecting pages
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { requireAuth?: boolean; redirectTo?: string } = {}
) => {
  const { requireAuth = true, redirectTo = '/login' } = options;

  const AuthenticatedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedRoute requireAuth={requireAuth} redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
};
