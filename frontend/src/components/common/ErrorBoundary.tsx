'use client';

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/DesignSystem';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  retryCount: number;
  maxRetries: number;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  retryCount,
  maxRetries
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-96 flex items-center justify-center p-8"
    >
      <div className="text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto h-16 w-16 text-red-500 mb-6"
        >
          <ExclamationTriangleIcon className="h-full w-full" />
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Something went wrong
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-6"
        >
          {process.env.NODE_ENV === 'development' 
            ? error.message 
            : "We're sorry, but something unexpected happened. Please try again."
          }
        </motion.p>
        
        {retryCount < maxRetries && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <Button
              onClick={resetErrorBoundary}
              variant="primary"
              className="inline-flex items-center space-x-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            
            {retryCount > 0 && (
              <p className="text-sm text-gray-500">
                Retry attempt {retryCount} of {maxRetries}
              </p>
            )}
          </motion.div>
        )}
        
        {retryCount >= maxRetries && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <p className="text-sm text-red-600 mb-4">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              Refresh Page
            </Button>
          </motion.div>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-left"
          >
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-40">
              {error.stack}
            </pre>
          </motion.details>
        )}
      </div>
    </motion.div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys![index]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when any props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback: Fallback = DefaultErrorFallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      return (
        <Fallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorFallbackProps };
