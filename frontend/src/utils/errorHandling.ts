// Error types and utilities for consistent error handling across the application

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface NetworkError extends ApiError {
  type: 'network';
  isOffline?: boolean;
  isTimeout?: boolean;
}

export interface ValidationError extends ApiError {
  type: 'validation';
  field?: string;
  errors?: Record<string, string[]>;
}

export interface AuthenticationError extends ApiError {
  type: 'authentication';
  requiresLogin?: boolean;
}

export interface AuthorizationError extends ApiError {
  type: 'authorization';
  requiredRole?: string;
}

export interface ServerError extends ApiError {
  type: 'server';
  isRetryable?: boolean;
}

export type AppError = NetworkError | ValidationError | AuthenticationError | AuthorizationError | ServerError;

// Error classification utilities
export function isNetworkError(error: any): error is NetworkError {
  return error?.type === 'network' || 
         error?.code === 'NETWORK_ERROR' ||
         error?.message?.includes('fetch') ||
         error?.message?.includes('network');
}

export function isValidationError(error: any): error is ValidationError {
  return error?.type === 'validation' || 
         error?.status === 400 ||
         error?.code === 'VALIDATION_ERROR';
}

export function isAuthenticationError(error: any): error is AuthenticationError {
  return error?.type === 'authentication' || 
         error?.status === 401 ||
         error?.code === 'AUTHENTICATION_ERROR';
}

export function isAuthorizationError(error: any): error is AuthorizationError {
  return error?.type === 'authorization' || 
         error?.status === 403 ||
         error?.code === 'AUTHORIZATION_ERROR';
}

export function isServerError(error: any): error is ServerError {
  return error?.type === 'server' || 
         (error?.status >= 500 && error?.status < 600) ||
         error?.code === 'SERVER_ERROR';
}

export function isRetryableError(error: any): boolean {
  if (isServerError(error)) {
    return error.isRetryable !== false; // Default to retryable for server errors
  }
  
  if (isNetworkError(error)) {
    return !error.isTimeout; // Don't retry timeouts
  }
  
  return false; // Don't retry validation, auth errors
}

// Error parsing from API responses
export function parseApiError(error: any): AppError {
  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      isOffline: !navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }

  // Handle timeout errors
  if (error?.name === 'AbortError' || error?.code === 'TIMEOUT') {
    return {
      type: 'network',
      message: 'Request timed out. Please try again.',
      isTimeout: true,
      timestamp: new Date().toISOString()
    };
  }

  // Handle HTTP response errors
  if (error?.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.detail || 'An error occurred';

    switch (status) {
      case 400:
        return {
          type: 'validation',
          message,
          status,
          field: data?.field,
          errors: data?.errors,
          timestamp: new Date().toISOString()
        };

      case 401:
        return {
          type: 'authentication',
          message: message || 'Authentication required',
          status,
          requiresLogin: true,
          timestamp: new Date().toISOString()
        };

      case 403:
        return {
          type: 'authorization',
          message: message || 'Access denied',
          status,
          requiredRole: data?.required_role,
          timestamp: new Date().toISOString()
        };

      case 404:
        return {
          type: 'server',
          message: message || 'Resource not found',
          status,
          isRetryable: false,
          timestamp: new Date().toISOString()
        };

      case 429:
        return {
          type: 'server',
          message: message || 'Too many requests. Please try again later.',
          status,
          isRetryable: true,
          timestamp: new Date().toISOString()
        };

      default:
        if (status >= 500) {
          return {
            type: 'server',
            message: message || 'Server error occurred',
            status,
            isRetryable: true,
            timestamp: new Date().toISOString()
          };
        }
    }
  }

  // Handle generic errors
  return {
    type: 'server',
    message: error?.message || 'An unexpected error occurred',
    status: error?.status,
    code: error?.code,
    isRetryable: false,
    timestamp: new Date().toISOString()
  };
}

// User-friendly error messages
export function getErrorMessage(error: AppError): string {
  switch (error.type) {
    case 'network':
      if (error.isOffline) {
        return 'You appear to be offline. Please check your internet connection.';
      }
      if (error.isTimeout) {
        return 'The request took too long to complete. Please try again.';
      }
      return 'Network error occurred. Please check your connection and try again.';

    case 'validation':
      return error.message || 'Please check your input and try again.';

    case 'authentication':
      return 'Please log in to continue.';

    case 'authorization':
      return 'You don\'t have permission to perform this action.';

    case 'server':
      if (error.status === 404) {
        return 'The requested resource was not found.';
      }
      if (error.status === 429) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      return 'A server error occurred. Please try again later.';

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Error action suggestions
export function getErrorActions(error: AppError): Array<{ label: string; action: string }> {
  const actions: Array<{ label: string; action: string }> = [];

  if (isRetryableError(error)) {
    actions.push({ label: 'Try Again', action: 'retry' });
  }

  if (isAuthenticationError(error)) {
    actions.push({ label: 'Log In', action: 'login' });
  }

  if (isNetworkError(error) && error.isOffline) {
    actions.push({ label: 'Check Connection', action: 'check-connection' });
  }

  // Always provide a way to go back or refresh
  actions.push({ label: 'Go Back', action: 'back' });
  actions.push({ label: 'Refresh Page', action: 'refresh' });

  return actions;
}

// Error logging utility
export function logError(error: AppError, context?: string): void {
  const logData = {
    error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', logData);
  }

  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // errorTrackingService.captureError(logData);
}

// Global error handler setup
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = parseApiError(event.reason);
    logError(error, 'unhandled-promise-rejection');
    
    // Prevent the default browser error handling
    event.preventDefault();
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    const error = parseApiError(event.error);
    logError(error, 'global-javascript-error');
  });
}

export default {
  parseApiError,
  getErrorMessage,
  getErrorActions,
  logError,
  setupGlobalErrorHandling,
  isNetworkError,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isServerError,
  isRetryableError
};
