import React from 'react';
import { useRouter } from 'next/router';
import { SearchResult, GlobalSearchResponse } from '../../services/searchService';
import { searchService } from '../../services/searchService';

interface SearchResultsProps {
  searchResponse: GlobalSearchResponse | null;
  isLoading: boolean;
  error: string | null;
  query: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function SearchResults({ 
  searchResponse, 
  isLoading, 
  error, 
  query,
  onLoadMore,
  hasMore = false
}: SearchResultsProps) {
  const router = useRouter();

  const handleResultClick = (result: SearchResult) => {
    const formatted = searchService.formatSearchResult(result);
    router.push(formatted.url);
  };

  const renderSearchResult = (result: SearchResult) => {
    const formatted = searchService.formatSearchResult(result);
    
    return (
      <div
        key={result.id}
        onClick={() => handleResultClick(result)}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0 mt-1">
            {formatted.icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Subtitle */}
            <div className="flex items-center space-x-2 mb-1">
              <h3 
                className="text-lg font-medium text-gray-900 truncate"
                dangerouslySetInnerHTML={{ 
                  __html: searchService.highlightSearchTerms(formatted.title, query) 
                }}
              />
              <span className="text-sm text-gray-500 capitalize">
                {result.type}
              </span>
            </div>
            
            {/* Subtitle */}
            {formatted.subtitle && (
              <p 
                className="text-sm text-gray-600 mb-2"
                dangerouslySetInnerHTML={{ 
                  __html: searchService.highlightSearchTerms(formatted.subtitle, query) 
                }}
              />
            )}
            
            {/* Description */}
            <p 
              className="text-sm text-gray-700 line-clamp-2"
              dangerouslySetInnerHTML={{ 
                __html: searchService.highlightSearchTerms(formatted.description, query) 
              }}
            />
            
            {/* Badges */}
            {formatted.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formatted.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>
                  Relevance: {Math.round(result.relevance_score * 100)}%
                </span>
                <span>
                  {new Date(result.updated_at).toLocaleDateString()}
                </span>
              </div>
              
              {/* Type-specific metadata */}
              {result.type === 'policy' && result.metadata.premium && (
                <span className="font-medium text-green-600">
                  ${result.metadata.premium}/month
                </span>
              )}
              
              {result.type === 'document' && result.metadata.file_size && (
                <span>
                  {(result.metadata.file_size / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
              
              {result.type === 'carrier' && result.metadata.policy_count && (
                <span>
                  {result.metadata.policy_count} policies
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFacets = () => {
    if (!searchResponse?.facets) return null;

    const { types, carriers, policy_types, date_ranges } = searchResponse.facets;
    const hasFacets = Object.keys(types).length > 0 || 
                     Object.keys(carriers).length > 0 || 
                     Object.keys(policy_types).length > 0;

    if (!hasFacets) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Refine Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Content Types */}
          {Object.keys(types).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                Content Type
              </h4>
              <div className="space-y-1">
                {Object.entries(types).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('types', type);
                      router.push(`${window.location.pathname}?${params.toString()}`);
                    }}
                    className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900"
                  >
                    <span className="capitalize">{type}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Carriers */}
          {Object.keys(carriers).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                Carriers
              </h4>
              <div className="space-y-1">
                {Object.entries(carriers).slice(0, 5).map(([carrier, count]) => (
                  <button
                    key={carrier}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('carrier', carrier);
                      router.push(`${window.location.pathname}?${params.toString()}`);
                    }}
                    className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900"
                  >
                    <span className="truncate">{carrier}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Policy Types */}
          {Object.keys(policy_types).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                Policy Types
              </h4>
              <div className="space-y-1">
                {Object.entries(policy_types).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('policy_type', type);
                      router.push(`${window.location.pathname}?${params.toString()}`);
                    }}
                    className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900"
                  >
                    <span className="capitalize">{type}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSearchStats = () => {
    if (!searchResponse) return null;

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {searchResponse.total_count > 0 ? (
            <>
              Found <span className="font-medium">{searchResponse.total_count.toLocaleString()}</span> results
              {query && (
                <>
                  {' '}for "<span className="font-medium">{query}</span>"
                </>
              )}
              <span className="text-gray-400 ml-2">
                ({searchResponse.search_time_ms}ms)
              </span>
            </>
          ) : (
            <>No results found{query && ` for "${query}"`}</>
          )}
        </div>
        
        {searchResponse.suggestions.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Try: </span>
            {searchResponse.suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('q', suggestion);
                  router.push(`${window.location.pathname}?${params.toString()}`);
                }}
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-400 mr-3">❌</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Search Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !searchResponse) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!searchResponse || searchResponse.results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No results found
        </h3>
        <p className="text-gray-600 mb-4">
          {query ? `We couldn't find anything matching "${query}"` : 'Try adjusting your search criteria'}
        </p>
        <div className="text-sm text-gray-500">
          <p>Suggestions:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your spelling</li>
            <li>• Try different keywords</li>
            <li>• Use fewer filters</li>
            <li>• Search for broader terms</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSearchStats()}
      {renderFacets()}
      
      <div className="space-y-4">
        {searchResponse.results.map(renderSearchResult)}
      </div>
      
      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                Loading...
              </>
            ) : (
              'Load More Results'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
