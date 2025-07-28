import React from 'react';
import { Card, Badge } from '../ui/DesignSystem';
import { AlertTriangleIcon, AlertCircleIcon, InfoIcon, XCircleIcon } from 'lucide-react';
import RegulatoryBadge from './RegulatoryBadge';
import CategoryIcon from './CategoryIcon';

interface CategorizedRedFlag {
  red_flag: {
    id: string;
    flag_type: string;
    severity: string;
    title: string;
    description: string;
    source_text?: string;
    page_number?: string;
    recommendation?: string;
    confidence_score?: number;
    detected_by: string;
    regulatory_level?: 'federal' | 'state' | 'federal_state';
    prominent_category?: 'coverage_access' | 'cost_financial' | 'medical_necessity_exclusions' | 'process_administrative' | 'special_populations';
    federal_regulation?: string;
    state_regulation?: string;
    state_code?: string;
    regulatory_context?: string;
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
  };
  regulatory_badges: string[];
  visual_indicators: {
    badge_color: string;
    category_icon: string;
    risk_color?: string;
    regulatory_badges: string[];
  };
  risk_indicators: {
    risk_level?: string;
    risk_color?: string;
    severity: string;
  };
}

interface CategorizedRedFlagCardProps {
  categorizedRedFlag: CategorizedRedFlag;
  showDetails?: boolean;
}

const CategorizedRedFlagCard: React.FC<CategorizedRedFlagCardProps> = ({
  categorizedRedFlag,
  showDetails = true
}) => {
  const { red_flag, regulatory_badges, visual_indicators, risk_indicators } = categorizedRedFlag;

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircleIcon className="h-5 w-5 text-orange-500" />;
      case 'low':
        return <InfoIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-red-50 border-red-400 text-red-700';
      case 'medium':
        return 'bg-orange-50 border-orange-400 text-orange-700';
      case 'low':
        return 'bg-yellow-50 border-yellow-400 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-700';
    }
  };

  const getRiskLevelBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'warning',
      low: 'secondary'
    };
    
    return (
      <Badge variant={colors[riskLevel as keyof typeof colors] || 'secondary'} size="sm">
        Risk: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
      </Badge>
    );
  };

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

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`w-full hover:shadow-lg transition-shadow duration-200 border-l-4 ${getSeverityColor(red_flag.severity)} p-6`}>
      <div className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getSeverityIcon(red_flag.severity)}
            {red_flag.prominent_category && (
              <CategoryIcon
                category={red_flag.prominent_category}
                riskLevel={red_flag.risk_level}
                size={18}
                className="text-gray-600"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {red_flag.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {red_flag.regulatory_level && (
              <RegulatoryBadge
                regulatoryLevel={red_flag.regulatory_level}
                federalRegulation={red_flag.federal_regulation}
                stateRegulation={red_flag.state_regulation}
                stateCode={red_flag.state_code}
                regulatoryContext={red_flag.regulatory_context}
              />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Badge variant="info" size="sm">
            {red_flag.severity.charAt(0).toUpperCase() + red_flag.severity.slice(1)} Severity
          </Badge>
          {red_flag.prominent_category && (
            <Badge variant="secondary" size="sm">
              {getCategoryDisplayName(red_flag.prominent_category)}
            </Badge>
          )}
          {getRiskLevelBadge(red_flag.risk_level)}
        </div>
      </div>

      {showDetails && (
        <div className="pt-0">
          <div className="mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {red_flag.description}
            </p>
          </div>

          {red_flag.source_text && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Source Text:</h4>
              <p className="text-sm text-gray-600 italic">"{red_flag.source_text}"</p>
              {red_flag.page_number && (
                <p className="text-xs text-gray-500 mt-1">Page: {red_flag.page_number}</p>
              )}
            </div>
          )}

          {red_flag.recommendation && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Recommendation:</h4>
              <p className="text-sm text-blue-700">{red_flag.recommendation}</p>
            </div>
          )}

          {red_flag.regulatory_context && (
            <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-md">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Regulatory Context:</h4>
              <p className="text-sm text-amber-700">{red_flag.regulatory_context}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Type: {red_flag.flag_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span>Detected by: {red_flag.detected_by}</span>
            </div>
            {red_flag.confidence_score && (
              <span className={`font-medium ${getConfidenceColor(red_flag.confidence_score)}`}>
                Confidence: {Math.round(red_flag.confidence_score * 100)}%
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CategorizedRedFlagCard;
