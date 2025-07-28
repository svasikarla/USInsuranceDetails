import React, { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface RetryState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  canRetry: boolean;
}

interface RetryActions {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
): [RetryState, RetryActions, T | null] {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    maxDelay = 10000,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    canRetry: true
  });

  const [data, setData] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);

  // Update ref when state changes
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const calculateDelay = useCallback((attempt: number): number => {
    const calculatedDelay = delay * Math.pow(backoffMultiplier, attempt);
    return Math.min(calculatedDelay, maxDelay);
  }, [delay, backoffMultiplier, maxDelay]);

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const executeWithRetry = useCallback(async (isRetry = false): Promise<void> => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Get current retry count before updating state
    const currentRetryCount = isRetry ? stateRef.current.retryCount + 1 : 0;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: currentRetryCount,
      canRetry: currentRetryCount < maxRetries
    }));

    try {
      // Add delay for retries (exponential backoff)
      if (isRetry && currentRetryCount > 0) {
        const retryDelay = calculateDelay(currentRetryCount - 1);
        await sleep(retryDelay);
      }

      const result = await asyncFunction();

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const errorObj = error instanceof Error ? error : new Error(String(error));
      const canRetryNext = currentRetryCount < maxRetries;

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorObj,
        canRetry: canRetryNext
      }));

      if (canRetryNext) {
        onRetry?.(currentRetryCount + 1, errorObj);
      } else {
        onMaxRetriesReached?.(errorObj);
      }
    }
  }, [asyncFunction, maxRetries, calculateDelay, sleep, onRetry, onMaxRetriesReached]);

  const execute = useCallback(() => executeWithRetry(false), [executeWithRetry]);
  const retry = useCallback(() => executeWithRetry(true), [executeWithRetry]);

  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      canRetry: true
    });
    setData(null);
  }, []);

  return [state, { execute, retry, reset }, data];
}

// Hook for automatic retry with exponential backoff
export function useAutoRetry<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: RetryOptions = {}
): [RetryState, T | null, () => void] {
  const [state, actions, data] = useRetry(asyncFunction, options);

  // Auto-execute when dependencies change
  React.useEffect(() => {
    actions.execute();
  }, dependencies);

  return [state, data, actions.retry];
}

// Hook for manual retry with loading states
export function useManualRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
): [RetryState, T | null, () => Promise<void>, () => void] {
  const [state, actions, data] = useRetry(asyncFunction, options);

  return [state, data, actions.execute, actions.reset];
}

// Hook for optimistic updates with retry
export function useOptimisticRetry<T>(
  asyncFunction: () => Promise<T>,
  optimisticValue: T,
  options: RetryOptions = {}
): [RetryState, T | null, () => Promise<void>] {
  const [state, actions, data] = useRetry(asyncFunction, options);
  
  // Return optimistic value while loading, actual data when available
  const displayValue = state.isLoading && state.retryCount === 0 ? optimisticValue : data;

  return [state, displayValue, actions.execute];
}

export default useRetry;
