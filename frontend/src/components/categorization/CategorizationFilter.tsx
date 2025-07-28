import React, { useState } from 'react';
import { Card, Button, Badge } from '../ui/DesignSystem';
import { FilterIcon, XIcon } from 'lucide-react';

interface CategorizationFilterProps {
  onFilterChange: (filters: CategorizationFilters) => void;
  showRedFlagFilters?: boolean;
}

interface CategorizationFilters {
  regulatory_level: string[];
  prominent_category: string[];
  federal_regulation: string[];
  state_regulation: string[];
  risk_level?: string[];
}

const CategorizationFilter: React.FC<CategorizationFilterProps> = ({
  onFilterChange,
  showRedFlagFilters = false
}) => {
  const [filters, setFilters] = useState<CategorizationFilters>({
    regulatory_level: [],
    prominent_category: [],
    federal_regulation: [],
    state_regulation: [],
    risk_level: []
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const regulatoryLevels = [
    { value: 'federal', label: 'Federal', color: 'blue' },
    { value: 'state', label: 'State', color: 'orange' },
    { value: 'federal_state', label: 'Federal + State', color: 'teal' }
  ];

  const prominentCategories = [
    { value: 'coverage_access', label: 'Coverage & Access' },
    { value: 'cost_financial', label: 'Cost & Financial' },
    { value: 'medical_necessity_exclusions', label: 'Medical Necessity & Exclusions' },
    { value: 'process_administrative', label: 'Process & Administrative' },
    { value: 'special_populations', label: 'Special Populations' }
  ];

  const federalRegulations = [
    { value: 'aca_ehb', label: 'ACA Essential Health Benefits' },
    { value: 'mental_health_parity', label: 'Mental Health Parity Act' },
    { value: 'erisa', label: 'ERISA' },
    { value: 'federal_consumer_protection', label: 'Federal Consumer Protection' },
    { value: 'preventive_care', label: 'Preventive Care' },
    { value: 'emergency_services', label: 'Emergency Services' }
  ];

  const stateRegulations = [
    { value: 'state_mandated_benefits', label: 'State Mandated Benefits' },
    { value: 'state_consumer_protection', label: 'State Consumer Protection' },
    { value: 'state_network_adequacy', label: 'State Network Adequacy' },
    { value: 'state_prior_auth_limits', label: 'State Prior Auth Limits' },
    { value: 'state_coverage_requirements', label: 'State Coverage Requirements' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Low Risk', color: 'yellow' },
    { value: 'medium', label: 'Medium Risk', color: 'orange' },
    { value: 'high', label: 'High Risk', color: 'red' },
    { value: 'critical', label: 'Critical Risk', color: 'red' }
  ];

  const toggleFilter = (category: keyof CategorizationFilters, value: string) => {
    const newFilters = { ...filters };
    const currentValues = newFilters[category] || [];
    
    if (currentValues.includes(value)) {
      newFilters[category] = currentValues.filter(v => v !== value);
    } else {
      newFilters[category] = [...currentValues, value];
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      regulatory_level: [],
      prominent_category: [],
      federal_regulation: [],
      state_regulation: [],
      risk_level: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filterArray) => count + (filterArray?.length || 0), 0);
  };

  const FilterSection = ({ title, items, category, colorKey }: {
    title: string;
    items: Array<{ value: string; label: string; color?: string }>;
    category: keyof CategorizationFilters;
    colorKey?: string;
  }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const isSelected = filters[category]?.includes(item.value) || false;
          return (
            <Button
              key={item.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(category, item.value)}
              className={`text-xs ${isSelected ? `bg-${item.color || 'blue'}-500 hover:bg-${item.color || 'blue'}-600` : ''}`}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="w-full p-6">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Categorization Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" size="sm">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          <FilterSection
            title="Regulatory Level"
            items={regulatoryLevels}
            category="regulatory_level"
          />

          <FilterSection
            title="Category"
            items={prominentCategories}
            category="prominent_category"
          />

          <FilterSection
            title="Federal Regulations"
            items={federalRegulations}
            category="federal_regulation"
          />

          <FilterSection
            title="State Regulations"
            items={stateRegulations}
            category="state_regulation"
          />

          {showRedFlagFilters && (
            <FilterSection
              title="Risk Level"
              items={riskLevels}
              category="risk_level"
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default CategorizationFilter;
