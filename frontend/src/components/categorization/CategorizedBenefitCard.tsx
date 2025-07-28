import React from 'react';
import { Card, Badge } from '../ui/DesignSystem';
import RegulatoryBadge from './RegulatoryBadge';
import CategoryIcon from './CategoryIcon';

interface CategorizedBenefit {
  benefit: {
    id: string;
    benefit_category: string;
    benefit_name: string;
    coverage_percentage?: number;
    copay_amount?: number;
    coinsurance_percentage?: number;
    requires_preauth: boolean;
    network_restriction?: string;
    annual_limit?: number;
    visit_limit?: number;
    notes?: string;
    regulatory_level?: 'federal' | 'state' | 'federal_state';
    prominent_category?: 'coverage_access' | 'cost_financial' | 'medical_necessity_exclusions' | 'process_administrative' | 'special_populations';
    federal_regulation?: string;
    state_regulation?: string;
    state_code?: string;
    regulatory_context?: string;
  };
  regulatory_badges: string[];
  visual_indicators: {
    badge_color: string;
    category_icon: string;
    regulatory_badges: string[];
  };
}

interface CategorizedBenefitCardProps {
  categorizedBenefit: CategorizedBenefit;
  showDetails?: boolean;
}

const CategorizedBenefitCard: React.FC<CategorizedBenefitCardProps> = ({
  categorizedBenefit,
  showDetails = true
}) => {
  const { benefit, regulatory_badges, visual_indicators } = categorizedBenefit;

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'coverage_access':
        return 'Coverage & Access';
      case 'cost_financial':
        return 'Cost & Financial';
      case 'medical_necessity_exclusions':
        return 'Medical Necessity & Exclusions';
      case 'process_administrative':
        return 'Process & Administrative';
      case 'special_populations':
        return 'Special Populations';
      default:
        return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (percentage?: number) => {
    if (!percentage) return 'N/A';
    return `${percentage}%`;
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {benefit.prominent_category && (
              <CategoryIcon
                category={benefit.prominent_category}
                size={20}
                className="text-gray-600"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {benefit.benefit_name}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {benefit.regulatory_level && (
              <RegulatoryBadge
                regulatoryLevel={benefit.regulatory_level}
                federalRegulation={benefit.federal_regulation}
                stateRegulation={benefit.state_regulation}
                stateCode={benefit.state_code}
                regulatoryContext={benefit.regulatory_context}
              />
            )}
          </div>
        </div>

        {benefit.prominent_category && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="info" size="sm">
              {getCategoryDisplayName(benefit.prominent_category)}
            </Badge>
            <Badge variant="secondary" size="sm">
              {benefit.benefit_category}
            </Badge>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {benefit.coverage_percentage && (
              <div>
                <span className="text-sm font-medium text-gray-500">Coverage</span>
                <p className="text-sm text-gray-900">{formatPercentage(benefit.coverage_percentage)}</p>
              </div>
            )}
            
            {benefit.copay_amount && (
              <div>
                <span className="text-sm font-medium text-gray-500">Copay</span>
                <p className="text-sm text-gray-900">{formatCurrency(benefit.copay_amount)}</p>
              </div>
            )}
            
            {benefit.coinsurance_percentage && (
              <div>
                <span className="text-sm font-medium text-gray-500">Coinsurance</span>
                <p className="text-sm text-gray-900">{formatPercentage(benefit.coinsurance_percentage)}</p>
              </div>
            )}
            
            {benefit.annual_limit && (
              <div>
                <span className="text-sm font-medium text-gray-500">Annual Limit</span>
                <p className="text-sm text-gray-900">{formatCurrency(benefit.annual_limit)}</p>
              </div>
            )}
            
            {benefit.visit_limit && (
              <div>
                <span className="text-sm font-medium text-gray-500">Visit Limit</span>
                <p className="text-sm text-gray-900">{benefit.visit_limit} visits</p>
              </div>
            )}
            
            {benefit.network_restriction && (
              <div>
                <span className="text-sm font-medium text-gray-500">Network</span>
                <p className="text-sm text-gray-900">
                  {benefit.network_restriction.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm">
            {benefit.requires_preauth && (
              <Badge variant="warning" size="sm">
                Prior Auth Required
              </Badge>
            )}
          </div>

          {benefit.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">{benefit.notes}</p>
            </div>
          )}

          {benefit.regulatory_context && (
            <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Regulatory Context:</span> {benefit.regulatory_context}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CategorizedBenefitCard;
