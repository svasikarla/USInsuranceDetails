import React, { useState, useEffect } from 'react';
import { AdvancedSearchFilters } from '../../services/searchService';
import { carrierApi } from '../../services/apiService';
import { InsuranceCarrier } from '../../types/api';

interface SearchFiltersProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
}

export default function SearchFiltersComponent({ 
  filters, 
  onFiltersChange, 
  showAdvanced = false,
  onToggleAdvanced 
}: SearchFiltersProps) {
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load carriers for filter options
  useEffect(() => {
    const loadCarriers = async () => {
      setIsLoading(true);
      try {
        const carriersData = await carrierApi.getCarriers();
        setCarriers(carriersData);
      } catch (error) {
        console.error('Failed to load carriers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCarriers();
  }, []);

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleArrayFilterChange = (key: keyof AdvancedSearchFilters, value: string, checked: boolean) => {
    const currentArray = (filters[key] as string[]) || [];
    let newArray: string[];
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({
      query: filters.query // Keep the search query
    });
  };

  const getActiveFilterCount = () => {
    const filterKeys = Object.keys(filters) as (keyof AdvancedSearchFilters)[];
    return filterKeys.filter(key => {
      if (key === 'query') return false; // Don't count query as a filter
      const value = filters[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
          {onToggleAdvanced && (
            <button
              onClick={onToggleAdvanced}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Content Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <div className="space-y-2">
              {[
                { value: 'policy', label: '📋 Policies' },
                { value: 'document', label: '📄 Documents' },
                { value: 'carrier', label: '🏢 Carriers' }
              ].map(type => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.types || []).includes(type.value)}
                    onChange={(e) => handleArrayFilterChange('types', type.value, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Carriers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Carrier
            </label>
            <select
              value={filters.carrier_ids?.[0] || ''}
              onChange={(e) => handleFilterChange('carrier_ids', e.target.value ? [e.target.value] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Carriers</option>
              {carriers.map(carrier => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Policy Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type
            </label>
            <select
              value={filters.policy_types?.[0] || ''}
              onChange={(e) => handleFilterChange('policy_types', e.target.value ? [e.target.value] : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="health">Health Insurance</option>
              <option value="dental">Dental Insurance</option>
              <option value="vision">Vision Insurance</option>
              <option value="life">Life Insurance</option>
              <option value="disability">Disability Insurance</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Premium Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium Range ($)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={filters.premium_min || ''}
                    onChange={(e) => handleFilterChange('premium_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Min premium"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={filters.premium_max || ''}
                    onChange={(e) => handleFilterChange('premium_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Max premium"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Processing Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Processing Status
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'pending', label: '⏳ Pending' },
                    { value: 'processing', label: '⚙️ Processing' },
                    { value: 'completed', label: '✅ Completed' },
                    { value: 'failed', label: '❌ Failed' }
                  ].map(status => (
                    <label key={status.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(filters.processing_status || []).includes(status.value)}
                        onChange={(e) => handleArrayFilterChange('processing_status', status.value, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Red Flags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red Flags
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.has_red_flags || false}
                      onChange={(e) => handleFilterChange('has_red_flags', e.target.checked || undefined)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has Red Flags</span>
                  </label>
                  
                  {filters.has_red_flags && (
                    <div className="ml-6 space-y-1">
                      {[
                        { value: 'critical', label: '🔴 Critical' },
                        { value: 'high', label: '🟠 High' },
                        { value: 'medium', label: '🟡 Medium' },
                        { value: 'low', label: '🟢 Low' }
                      ].map(severity => (
                        <label key={severity.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(filters.red_flag_severity || []).includes(severity.value)}
                            onChange={(e) => handleArrayFilterChange('red_flag_severity', severity.value, e.target.checked)}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-xs text-gray-600">{severity.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Network Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'in-network', label: 'In-Network' },
                    { value: 'out-of-network', label: 'Out-of-Network' },
                    { value: 'both', label: 'Both' }
                  ].map(network => (
                    <label key={network.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(filters.network_types || []).includes(network.value)}
                        onChange={(e) => handleArrayFilterChange('network_types', network.value, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{network.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'pdf', label: '📄 PDF' },
                    { value: 'doc', label: '📝 Word' },
                    { value: 'txt', label: '📃 Text' },
                    { value: 'image', label: '🖼️ Image' }
                  ].map(fileType => (
                    <label key={fileType.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(filters.file_types || []).includes(fileType.value)}
                        onChange={(e) => handleArrayFilterChange('file_types', fileType.value, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{fileType.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Processing Confidence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Processing Confidence
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.processing_confidence_min || 0}
                  onChange={(e) => handleFilterChange('processing_confidence_min', parseInt(e.target.value) || undefined)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-medium">{filters.processing_confidence_min || 0}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort_by || 'relevance'}
                onChange={(e) => handleFilterChange('sort_by', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sort_order || 'desc'}
                onChange={(e) => handleFilterChange('sort_order', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
