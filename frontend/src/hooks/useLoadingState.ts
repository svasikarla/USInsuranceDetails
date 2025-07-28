import { useState, useCallback, useRef, useEffect } from 'react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoadingStateOptions {
  initialState?: LoadingState;
  timeout?: number;
  onTimeout?: () => void;
  onStateChange?: (state: LoadingState) => void;
}

interface LoadingStateReturn {
  state: LoadingState;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  error: Error | null;
  setLoading: () => void;
  setSuccess: () => void;
  setError: (error: Error | string) => void;
  setIdle: () => void;
  reset: () => void;
}

export function useLoadingState(options: LoadingStateOptions = {}): LoadingStateReturn {
  const {
    initialState = 'idle',
    timeout,
    onTimeout,
    onStateChange
  } = options;

  const [state, setState] = useState<LoadingState>(initialState);
  const [error, setErrorState] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      global.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setStateWithTimeout = useCallback((newState: LoadingState) => {
    setState(newState);
    onStateChange?.(newState);

    // Clear existing timeout
    clearTimeout();

    // Set timeout for loading state
    if (newState === 'loading' && timeout) {
      timeoutRef.current = global.setTimeout(() => {
        onTimeout?.();
        setState('error');
        setErrorState(new Error('Request timeout'));
      }, timeout);
    }
  }, [timeout, onTimeout, onStateChange, clearTimeout]);

  const setLoading = useCallback(() => {
    setErrorState(null);
    setStateWithTimeout('loading');
  }, [setStateWithTimeout]);

  const setSuccess = useCallback(() => {
    setErrorState(null);
    clearTimeout();
    setStateWithTimeout('success');
  }, [setStateWithTimeout, clearTimeout]);

  const setError = useCallback((error: Error | string) => {
    clearTimeout();
    const errorObj = error instanceof Error ? error : new Error(error);
    setErrorState(errorObj);
    setStateWithTimeout('error');
  }, [setStateWithTimeout, clearTimeout]);

  const setIdle = useCallback(() => {
    setErrorState(null);
    clearTimeout();
    setStateWithTimeout('idle');
  }, [setStateWithTimeout, clearTimeout]);

  const reset = useCallback(() => {
    setIdle();
  }, [setIdle]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout();
    };
  }, [clearTimeout]);

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    error,
    setLoading,
    setSuccess,
    setError,
    setIdle,
    reset
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates(keys: string[]): Record<string, LoadingStateReturn> {
  const states: Record<string, LoadingStateReturn> = {};
  
  keys.forEach(key => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    states[key] = useLoadingState();
  });

  return states;
}

// Hook for async operations with automatic loading state management
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  options: LoadingStateOptions & {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): [LoadingStateReturn, (data?: T) => Promise<T | undefined>, T | null] {
  const loadingState = useLoadingState(options);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (optimisticData?: T): Promise<T | undefined> => {
    try {
      loadingState.setLoading();
      
      // Set optimistic data if provided
      if (optimisticData !== undefined) {
        setData(optimisticData);
      }

      const result = await operation();
      setData(result);
      loadingState.setSuccess();
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      loadingState.setError(errorObj);
      options.onError?.(errorObj);
      
      // Reset optimistic data on error
      if (optimisticData !== undefined) {
        setData(null);
      }
      
      return undefined;
    }
  }, [operation, loadingState, options]);

  return [loadingState, execute, data];
}

// Hook for debounced loading states (useful for search, etc.)
export function useDebouncedLoadingState(
  delay: number = 300,
  options: LoadingStateOptions = {}
): LoadingStateReturn & { debouncedSetLoading: () => void } {
  const loadingState = useLoadingState(options);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSetLoading = useCallback(() => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      loadingState.setLoading();
    }, delay);
  }, [loadingState, delay]);

  // Override setSuccess and setError to clear debounce
  const setSuccess = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    loadingState.setSuccess();
  }, [loadingState]);

  const setError = useCallback((error: Error | string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    loadingState.setError(error);
  }, [loadingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...loadingState,
    setSuccess,
    setError,
    debouncedSetLoading
  };
}

export default useLoadingState;
