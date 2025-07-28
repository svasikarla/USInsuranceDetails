import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Layout, PageHeader, EmptyState } from '../../components/layout/Layout';
import { Card, Button, Badge, Input } from '../../components/ui/DesignSystem';
import GlobalSearch from '../../components/search/GlobalSearch';
import SearchFilters from '../../components/search/SearchFilters';
import SearchResults from '../../components/search/SearchResults';
import { searchService, AdvancedSearchFilters, GlobalSearchResponse } from '../../services/searchService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  FolderIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function SearchPage() {
  const router = useRouter();
  const [searchResponse, setSearchResponse] = useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    limit: 20,
    page: 1,
    sort_by: 'relevance',
    sort_order: 'desc'
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';
    const initialFilters: AdvancedSearchFilters = {
      query: initialQuery,
      types: urlParams.getAll('types').length > 0 ? urlParams.getAll('types') : undefined,
      carrier_ids: urlParams.getAll('carrier_ids').length > 0 ? urlParams.getAll('carrier_ids') : undefined,
      policy_types: urlParams.getAll('policy_types').length > 0 ? urlParams.getAll('policy_types') : undefined,
      processing_status: urlParams.getAll('processing_status').length > 0 ? urlParams.getAll('processing_status') : undefined,
      date_from: urlParams.get('date_from') || undefined,
      date_to: urlParams.get('date_to') || undefined,
      premium_min: urlParams.get('premium_min') ? parseFloat(urlParams.get('premium_min')!) : undefined,
      premium_max: urlParams.get('premium_max') ? parseFloat(urlParams.get('premium_max')!) : undefined,
      has_red_flags: urlParams.get('has_red_flags') === 'true' || undefined,
      sort_by: (urlParams.get('sort_by') as any) || 'relevance',
      sort_order: (urlParams.get('sort_order') as any) || 'desc',
      page: parseInt(urlParams.get('page') || '1'),
      limit: parseInt(urlParams.get('limit') || '20')
    };

    setFilters(initialFilters);
    setSearchQuery(initialQuery);
    setCurrentPage(initialFilters.page || 1);

    if (initialQuery) {
      performSearch(initialFilters);
    }
  }, []);

  const performSearch = async (searchFilters: AdvancedSearchFilters) => {
    if (!searchFilters.query?.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await searchService.performAdvancedSearch(searchFilters);
      setSearchResponse(response);
      
      // Update URL with search parameters
      const params = new URLSearchParams();
      if (searchFilters.query) params.set('q', searchFilters.query);
      if (searchFilters.types?.length) searchFilters.types.forEach(type => params.append('types', type));
      if (searchFilters.page && searchFilters.page > 1) params.set('page', searchFilters.page.toString());
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
      
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setSearchResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, query, page: 1 };
    setFilters(newFilters);
    setSearchQuery(query);
    setCurrentPage(1);
    performSearch(newFilters);
  };

  const handleFilterChange = (newFilters: AdvancedSearchFilters) => {
    const updatedFilters = { ...newFilters, page: 1 };
    setFilters(updatedFilters);
    setCurrentPage(1);
    performSearch(updatedFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    setCurrentPage(page);
    performSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: AdvancedSearchFilters = {
      query: searchQuery,
      limit: 20,
      page: 1,
      sort_by: 'relevance',
      sort_order: 'desc'
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    setShowAdvancedFilters(false);
    if (searchQuery) {
      performSearch(clearedFilters);
    }
  };

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'policy': return DocumentTextIcon;
      case 'document': return FolderIcon;
      case 'carrier': return BuildingOfficeIcon;
      default: return DocumentTextIcon;
    }
  };

  const getResultTypeBadge = (type: string) => {
    switch (type) {
      case 'policy': return { variant: 'primary' as const, label: 'Policy' };
      case 'document': return { variant: 'secondary' as const, label: 'Document' };
      case 'carrier': return { variant: 'info' as const, label: 'Carrier' };
      default: return { variant: 'secondary' as const, label: type };
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Search - InsureAI Platform</title>
        <meta name="description" content="Search and discover insights across your insurance policies, documents, and carriers" />
      </Head>
      <Layout showNavigation={true}>
        <PageHeader
          title="Advanced Search"
          description="Search across policies, documents, carriers, and more with powerful filtering options"
        />

        {/* Search Interface */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search policies, documents, carriers..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  icon={MagnifyingGlassIcon}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => handleSearch(searchQuery)}
                disabled={!searchQuery.trim() || isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <MagnifyingGlassIcon className="h-4 w-4" />
                )}
                <span>Search</span>
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </Button>
                {Object.keys(filters).some(key => 
                  key !== 'query' && key !== 'limit' && key !== 'page' && key !== 'sort_by' && key !== 'sort_order' && 
                  filters[key as keyof AdvancedSearchFilters]
                ) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </Button>
                )}
              </div>

              {searchResponse && (
                <div className="text-sm text-gray-600">
                  {searchResponse.total_results.toLocaleString()} results found
                  {searchResponse.search_time && (
                    <span> in {searchResponse.search_time}ms</span>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-4 border-t border-gray-200"
                >
                  <SearchFilters
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Search Results */}
        {error && (
          <Card className="p-6 mb-6">
            <div className="flex items-center space-x-3 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {isLoading && (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"
              />
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          </Card>
        )}

        {searchResponse && !isLoading && (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * filters.limit!) + 1}-{Math.min(currentPage * filters.limit!, searchResponse.total_results)} of {searchResponse.total_results.toLocaleString()} results
                  </span>
                  {searchResponse.categories && (
                    <div className="flex items-center space-x-2">
                      {Object.entries(searchResponse.categories).map(([type, count]) => {
                        const badge = getResultTypeBadge(type);
                        return (
                          <Badge key={type} variant={badge.variant} size="sm">
                            {badge.label}: {count}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    value={`${filters.sort_by}-${filters.sort_order}`}
                    onChange={(e) => {
                      const [sort_by, sort_order] = e.target.value.split('-');
                      handleFilterChange({ ...filters, sort_by: sort_by as any, sort_order: sort_order as any });
                    }}
                    className="text-sm border-gray-300 rounded-lg"
                  >
                    <option value="relevance-desc">Relevance</option>
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Search Results */}
            <SearchResults
              searchResponse={searchResponse}
              onResultSelect={(result) => {
                const formatted = searchService.formatSearchResult(result);
                router.push(formatted.url);
              }}
              onPageChange={handlePageChange}
              currentPage={currentPage}
            />
          </div>
        )}

        {!searchResponse && !isLoading && !error && (
          <EmptyState
            title="Start Your Search"
            description="Enter a search term above to find policies, documents, carriers, and more across your insurance data."
            icon={MagnifyingGlassIcon}
          />
        )}

        {searchResponse && searchResponse.results.length === 0 && !isLoading && (
          <EmptyState
            title="No Results Found"
            description="Try adjusting your search terms or filters to find what you're looking for."
            action={{
              label: "Clear Filters",
              onClick: clearFilters
            }}
            icon={MagnifyingGlassIcon}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}
