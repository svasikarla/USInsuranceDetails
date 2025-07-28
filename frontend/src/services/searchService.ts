import { apiClient } from './apiClient';
import { InsurancePolicy, PolicyDocument, InsuranceCarrier } from '../types/api';

// Search result types
export interface SearchResult {
  id: string;
  type: 'policy' | 'document' | 'carrier';
  title: string;
  subtitle: string;
  description: string;
  relevance_score: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
  total_count: number;
  search_time_ms: number;
  suggestions: string[];
  facets: {
    types: { [key: string]: number };
    carriers: { [key: string]: number };
    policy_types: { [key: string]: number };
    date_ranges: { [key: string]: number };
  };
}

export interface SearchFilters {
  query?: string;
  types?: string[]; // ['policy', 'document', 'carrier']
  carrier_ids?: string[];
  policy_types?: string[];
  date_from?: string;
  date_to?: string;
  processing_status?: string[];
  sort_by?: 'relevance' | 'date' | 'name' | 'type';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdvancedSearchFilters extends SearchFilters {
  premium_min?: number;
  premium_max?: number;
  has_red_flags?: boolean;
  red_flag_severity?: string[];
  network_types?: string[];
  file_types?: string[];
  processing_confidence_min?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'entity';
  category?: string;
  count?: number;
}

export interface QuickSearchResult {
  policies: InsurancePolicy[];
  documents: PolicyDocument[];
  carriers: InsuranceCarrier[];
  total_count: number;
}

class SearchService {
  // Global search across all entities
  async globalSearch(filters: SearchFilters): Promise<GlobalSearchResponse> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('q', filters.query);
    if (filters.types?.length) {
      filters.types.forEach(type => params.append('types', type));
    }
    if (filters.carrier_ids?.length) {
      filters.carrier_ids.forEach(id => params.append('carrier_ids', id));
    }
    if (filters.policy_types?.length) {
      filters.policy_types.forEach(type => params.append('policy_types', type));
    }
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.processing_status?.length) {
      filters.processing_status.forEach(status => params.append('processing_status', status));
    }
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/api/search/global?${params.toString()}`);
    return response.data;
  }

  // Advanced search with more complex filters
  async advancedSearch(filters: AdvancedSearchFilters): Promise<GlobalSearchResponse> {
    const params = new URLSearchParams();
    
    // Add basic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`/api/search/advanced?${params.toString()}`);
    return response.data;
  }

  // Quick search for autocomplete/suggestions
  async quickSearch(query: string, limit: number = 10): Promise<QuickSearchResult> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/api/search/quick?${params.toString()}`);
    return response.data;
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const params = new URLSearchParams();
    params.append('q', query);

    const response = await apiClient.get(`/api/search/suggestions?${params.toString()}`);
    return response.data;
  }

  // Search within specific entity type
  async searchPolicies(filters: SearchFilters): Promise<InsurancePolicy[]> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('search', filters.query);
    if (filters.carrier_ids?.length) params.append('carrier_id', filters.carrier_ids[0]);
    if (filters.policy_types?.length) params.append('policy_type', filters.policy_types[0]);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/api/policies?${params.toString()}`);
    return response.data;
  }

  async searchDocuments(filters: SearchFilters): Promise<PolicyDocument[]> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('search', filters.query);
    if (filters.carrier_ids?.length) params.append('carrier_id', filters.carrier_ids[0]);
    if (filters.processing_status?.length) params.append('processing_status', filters.processing_status[0]);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/api/documents?${params.toString()}`);
    return response.data;
  }

  async searchCarriers(filters: SearchFilters): Promise<InsuranceCarrier[]> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('search', filters.query);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/api/carriers?${params.toString()}`);
    return response.data;
  }

  // Save search query to local storage
  saveSearchQuery(query: string): void {
    if (typeof window !== 'undefined' && query) {
      try {
        const recentSearchesRaw = localStorage.getItem('recent_searches');
        const recentSearches = recentSearchesRaw ? JSON.parse(recentSearchesRaw) : [];
        const updatedSearches = [query, ...recentSearches.filter((s: string) => s !== query)].slice(0, 10);
        localStorage.setItem('recent_searches', JSON.stringify(updatedSearches));
      } catch (error) {
        console.warn('Failed to save recent search:', error);
      }
    }
  }

  // Get popular searches (mocked)
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    const popular = [
      "health insurance",
      "dental coverage",
      "vision benefits",
      "life insurance",
      "policy documents",
      "claim status",
      "find a doctor",
      "premium cost",
      "deductible information",
      "PPO plans"
    ];
    // In a real app, this would come from an API
    return Promise.resolve(popular.slice(0, limit));
  }

  // Get recent searches from local storage
  async getRecentSearches(limit: number = 10): Promise<string[]> {
    if (typeof window === 'undefined') {
      return Promise.resolve([]);
    }
    try {
      const recentSearches = localStorage.getItem('recent_searches');
      const searches = recentSearches ? JSON.parse(recentSearches) : [];
      return Promise.resolve(searches.slice(0, limit));
    } catch (error) {
      console.warn('Failed to get recent searches:', error);
      return Promise.resolve([]);
    }
  }

  // Format search results for display
  formatSearchResult(result: SearchResult): {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    url: string;
    badges: string[];
  } {
    const baseUrl = {
      policy: '/policies',
      document: '/documents',
      carrier: '/carriers'
    };

    const icons = {
      policy: '📋',
      document: '📄',
      carrier: '🏢'
    };

    const badges = [];
    if (result.metadata.policy_type) badges.push(result.metadata.policy_type);
    if (result.metadata.processing_status) badges.push(result.metadata.processing_status);
    if (result.metadata.carrier_name) badges.push(result.metadata.carrier_name);

    return {
      title: result.title,
      subtitle: result.subtitle,
      description: result.description,
      icon: icons[result.type],
      url: `${baseUrl[result.type]}/${result.id}`,
      badges
    };
  }

  // Highlight search terms in text
  highlightSearchTerms(text: string, query: string): string {
    if (!query || !text) return text;
    
    const terms = query.split(' ').filter(term => term.length > 2);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  // Build search URL with filters
  buildSearchUrl(filters: SearchFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return `/search?${params.toString()}`;
  }
}

export const searchService = new SearchService();
export default searchService;
