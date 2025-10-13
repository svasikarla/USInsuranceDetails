import type { AxiosError } from 'axios';
import { apiClient } from './apiClient';
import type { DashboardStats, InsurancePolicy, RedFlag } from '../types/api';

const logRequest = (url: string) => {
  return (response: any) => {
    console.log(`[DashboardService] Response from ${url}:`, response.status, response.data ? 'Data received' : 'No data');
    return response;
  };
};

interface DashboardData {
  stats: DashboardStats;
  recentPolicies: InsurancePolicy[];
  recentRedFlags: RedFlag[];
}

export const dashboardService = {
  async fetchDashboardData(): Promise<DashboardData> {
    console.log('[DashboardService] Starting to fetch dashboard data');

    const summaryResponse = await apiClient.get('/api/dashboard/summary')
      .then(logRequest('/api/dashboard/summary'));

    if (!summaryResponse?.data) {
      throw new Error('No dashboard summary received from server');
    }

    // Backend summary already contains recent_policies and recent_red_flags
    const summary = summaryResponse.data;

    console.log('[DashboardService] Successfully fetched dashboard summary');
    return {
      stats: summary,
      recentPolicies: summary.recent_policies || [],
      recentRedFlags: summary.recent_red_flags || []
    };
  },

  async fetchDashboardDataWithRetry(maxRetries = 3): Promise<DashboardData> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.fetchDashboardData();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DashboardService] Attempt ${i + 1} failed:`, error);
        
        // If it's the last retry or not a retryable error, throw
        if (i === maxRetries - 1 || !this.isRetryableError(error)) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, etc.
        console.log(`[DashboardService] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Failed to fetch dashboard data after maximum retries');
  },
  
  isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    // Consider network errors and 5xx/429 errors as retryable
    if ('isAxiosError' in error) {
      const axiosError = error as AxiosError;
      if (!axiosError.response) return true; // Network errors should be retried
      
      const status = axiosError.response.status;
      return status === 429 || status >= 500;
    }
    
    return false;
  },
  
  // Helper method to check if an error is a network error
  isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.message === 'Network Error';
  }
};
