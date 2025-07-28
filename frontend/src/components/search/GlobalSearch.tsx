import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { searchService, SearchFilters, SearchResult, QuickSearchResult } from '../../services/searchService';

interface GlobalSearchProps {
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}

export default function GlobalSearch({ 
  placeholder = "Search policies, documents, carriers...", 
  showFilters = true,
  autoFocus = false,
  onResultSelect 
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickResults, setQuickResults] = useState<QuickSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent and popular searches on mount
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [recent, popular] = await Promise.all([
          searchService.getRecentSearches(5),
          searchService.getPopularSearches(5)
        ]);
        setRecentSearches(recent);
        setPopularSearches(popular);
      } catch (error) {
        console.error('Failed to load search data:', error);
      }
    };

    loadSearchData();
  }, []);

  // Auto-focus input if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performQuickSearch(query);
      } else {
        setQuickResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performQuickSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const results = await searchService.quickSearch(searchQuery, 8);
      setQuickResults(results);
    } catch (error) {
      console.error('Quick search failed:', error);
      setQuickResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      // Save search analytics
      searchService.saveSearchQuery(finalQuery, { query: finalQuery }, quickResults?.total_count || 0);
      
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      const formatted = searchService.formatSearchResult(result);
      router.push(formatted.url);
    }
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const renderQuickResults = () => {
    if (!quickResults) return null;

    const { policies, documents, carriers } = quickResults;
    const hasResults = policies.length > 0 || documents.length > 0 || carriers.length > 0;

    if (!hasResults) {
      return (
        <div className="p-4 text-center text-gray-500">
          <div className="text-sm">No results found for "{query}"</div>
          <button
            onClick={() => handleSearch()}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Search all results →
          </button>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {/* Policies */}
        {policies.length > 0 && (
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Policies ({policies.length})
            </div>
            {policies.slice(0, 3).map((policy) => (
              <div
                key={policy.id}
                onClick={() => router.push(`/policies/${policy.id}`)}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md"
              >
                <div className="text-lg mr-3">📋</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {policy.policy_name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {policy.policy_type} • {policy.carrier_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div className="p-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Documents ({documents.length})
            </div>
            {documents.slice(0, 3).map((document) => (
              <div
                key={document.id}
                onClick={() => router.push(`/documents/${document.id}`)}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md"
              >
                <div className="text-lg mr-3">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {document.original_filename}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {document.processing_status} • {new Date(document.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carriers */}
        {carriers.length > 0 && (
          <div className="p-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Carriers ({carriers.length})
            </div>
            {carriers.slice(0, 3).map((carrier) => (
              <div
                key={carrier.id}
                onClick={() => router.push(`/carriers/${carrier.id}`)}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md"
              >
                <div className="text-lg mr-3">🏢</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {carrier.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {carrier.code} • {carrier.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View all results */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={() => handleSearch()}
            className="w-full text-center py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all {quickResults.total_count} results →
          </button>
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    if (query.length >= 2) return null;

    return (
      <div className="p-4">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Recent Searches
            </div>
            {recentSearches.map((search, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(search)}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md"
              >
                <div className="text-gray-400 mr-3">🕒</div>
                <div className="text-sm text-gray-700">{search}</div>
              </div>
            ))}
          </div>
        )}

        {/* Popular Searches */}
        {popularSearches.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Popular Searches
            </div>
            {popularSearches.map((search, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(search)}
                className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md"
              >
                <div className="text-gray-400 mr-3">🔥</div>
                <div className="text-sm text-gray-700">{search}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
          {query.length >= 2 ? renderQuickResults() : renderSuggestions()}
        </div>
      )}
    </div>
  );
}
