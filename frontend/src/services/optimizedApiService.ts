import { apiClient } from './apiClient';
import {
  InsurancePolicy,
  PolicyDocument,
  InsuranceCarrier,
  RedFlag,
  CoverageBenefit,
  DashboardStats
} from '../types/api';

// ============================================================================
// TYPES FOR OPTIMIZED API RESPONSES
// ============================================================================

export interface CompleteDashboardData extends DashboardStats {
  // Enhanced dashboard data with all necessary information
  recent_policies: InsurancePolicy[];
  recent_red_flags: RedFlag[];
  critical_alerts: {
    expiringSoon: InsurancePolicy[];
    highSeverityFlags: RedFlag[];
    processingErrors: PolicyDocument[];
  };
  ai_insights?: {
    recommendations: Array<{
      id: string;
      type: 'coverage_gap' | 'cost_optimization' | 'policy_review';
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      action_url?: string;
    }>;
  };
}

export interface CompletePolicyData {
  policy: InsurancePolicy;
  benefits: CoverageBenefit[];
  red_flags: RedFlag[];
  document: PolicyDocument;
  carrier?: InsuranceCarrier;
}

export interface CompleteDocumentData {
  document: PolicyDocument;
  related_policies: InsurancePolicy[];
  carrier?: InsuranceCarrier;
  processing_status: {
    current_step: string;
    progress_percentage: number;
    estimated_completion?: string;
    error_details?: string;
  };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    // Don't cache null or undefined data
    if (data === null || data === undefined) {
      return;
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

// ============================================================================
// OPTIMIZED API SERVICE
// ============================================================================

class OptimizedApiService {
  private cache = new ApiCache();

  // ============================================================================
  // CACHE-AWARE FETCH METHOD
  // ============================================================================

  private async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    forceRefresh = false
  ): Promise<T> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.cache.has(key)) {
      const cachedData = this.cache.get<T>(key);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const data = await fetcher();
      this.cache.set(key, data, ttl);
      return data;
    } catch (error) {
      // If we have stale cached data and the request fails, return the stale data
      const staleData = this.cache.get<T>(key);
      if (staleData) {
        console.warn(`API request failed, returning stale data for ${key}:`, error);
        return staleData;
      }
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD API
  // ============================================================================

  async getDashboardComplete(forceRefresh = false): Promise<CompleteDashboardData> {
    return this.fetchWithCache(
      'dashboard-complete',
      () => apiClient.get('/api/dashboard/complete').then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  async getDashboardSummary(forceRefresh = false): Promise<DashboardStats> {
    return this.fetchWithCache(
      'dashboard-summary',
      () => apiClient.get('/api/dashboard/summary').then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  async getRecentPolicies(limit: number = 5, forceRefresh = false): Promise<InsurancePolicy[]> {
    return this.fetchWithCache(
      `recent-policies-${limit}`,
      () => apiClient.get(`/api/policies/recent?limit=${limit}`).then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  async getRecentRedFlags(limit: number = 5, forceRefresh = false): Promise<RedFlag[]> {
    return this.fetchWithCache(
      `recent-red-flags-${limit}`,
      () => apiClient.get(`/api/red-flags/recent?limit=${limit}`).then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  // ============================================================================
  // POLICY API
  // ============================================================================

  async getPolicyComplete(policyId: string, forceRefresh = false): Promise<CompletePolicyData> {
    return this.fetchWithCache(
      `policy-complete-${policyId}`,
      () => apiClient.get(`/api/policies/${policyId}/complete`).then(r => r.data),
      10 * 60 * 1000, // 10 minutes TTL
      forceRefresh
    );
  }

  async getPolicy(policyId: string, forceRefresh = false): Promise<InsurancePolicy> {
    return this.fetchWithCache(
      `policy-${policyId}`,
      () => apiClient.get(`/api/policies/${policyId}`).then(r => r.data),
      10 * 60 * 1000, // 10 minutes TTL
      forceRefresh
    );
  }

  async getPoliciesByUser(userId: string, forceRefresh = false): Promise<InsurancePolicy[]> {
    return this.fetchWithCache(
      `policies-user-${userId}`,
      () => apiClient.get(`/api/policies?user_id=${userId}`).then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  async getPoliciesByUser(userId: string, forceRefresh = false): Promise<InsurancePolicy[]> {
    return this.fetchWithCache(
      `policies-user-${userId}`,
      () => apiClient.get(`/api/policies?user_id=${userId}`).then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  // ============================================================================
  // DOCUMENT API
  // ============================================================================

  async getDocumentComplete(documentId: string, forceRefresh = false): Promise<CompleteDocumentData> {
    return this.fetchWithCache(
      `document-complete-${documentId}`,
      () => apiClient.get(`/api/documents/${documentId}/complete`).then(r => r.data),
      10 * 60 * 1000, // 10 minutes TTL
      forceRefresh
    );
  }

  async getDocumentsByUser(userId: string, forceRefresh = false): Promise<PolicyDocument[]> {
    return this.fetchWithCache(
      `documents-user-${userId}`,
      () => apiClient.get(`/api/documents?user_id=${userId}`).then(r => r.data),
      5 * 60 * 1000, // 5 minutes TTL
      forceRefresh
    );
  }

  // ============================================================================
  // CARRIER API
  // ============================================================================

  async getCarriers(forceRefresh = false): Promise<InsuranceCarrier[]> {
    return this.fetchWithCache(
      'carriers-all',
      () => apiClient.get('/api/carriers').then(r => r.data),
      30 * 60 * 1000, // 30 minutes TTL (carriers change infrequently)
      forceRefresh
    );
  }

  // ============================================================================
  // CACHE MANAGEMENT METHODS
  // ============================================================================

  invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern);
  }

  invalidateDashboardCache(): void {
    this.cache.invalidate('dashboard');
  }

  invalidatePolicyCache(policyId?: string): void {
    if (policyId) {
      this.cache.invalidate(`policy-${policyId}`);
    } else {
      this.cache.invalidate('policy');
    }
  }

  invalidateDocumentCache(documentId?: string): void {
    if (documentId) {
      this.cache.invalidate(`document-${documentId}`);
    } else {
      this.cache.invalidate('document');
    }
  }

  invalidateUserCache(userId: string): void {
    this.cache.invalidate(`user-${userId}`);
    this.cache.invalidate(`policies-user-${userId}`);
    this.cache.invalidate(`documents-user-${userId}`);
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  private measurePerformance<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return operation().finally(() => {
      const duration = performance.now() - start;
      console.debug(`API operation ${name} took ${duration.toFixed(2)}ms`);
      
      // Send to analytics if available
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('API Performance', {
          operation: name,
          duration,
          timestamp: Date.now(),
        });
      }
    });
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async batchFetch<T>(
    requests: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>
  ): Promise<T[]> {
    const promises = requests.map(({ key, fetcher, ttl }) =>
      this.fetchWithCache(key, fetcher, ttl)
    );
    
    return Promise.all(promises);
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; timestamp: number }> {
    try {
      await apiClient.get('/');
      return { status: 'healthy', timestamp: Date.now() };
    } catch (error) {
      return { status: 'unhealthy', timestamp: Date.now() };
    }
  }
}

// Export singleton instance
export const optimizedApiService = new OptimizedApiService();
