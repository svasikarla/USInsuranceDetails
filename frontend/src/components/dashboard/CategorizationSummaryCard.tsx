import React from 'react';
import { Card, Badge } from '../ui/DesignSystem';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  AlertTriangleIcon, 
  TrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';

interface CategorizationSummaryProps {
  categorizationSummary: {
    total_categorized_items: number;
    benefits_summary: {
      total: number;
      by_regulatory_level: Record<string, number>;
      by_prominent_category: Record<string, number>;
      by_federal_regulation: Record<string, number>;
    };
    red_flags_summary: {
      total: number;
      by_severity: Record<string, number>;
      by_risk_level: Record<string, number>;
      by_regulatory_level: Record<string, number>;
      by_prominent_category: Record<string, number>;
    };
    regulatory_compliance_score: number;
    top_regulatory_concerns: string[];
    coverage_gaps: string[];
  };
}

const CategorizationSummaryCard: React.FC<CategorizationSummaryProps> = ({
  categorizationSummary
}) => {
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    if (score >= 70) return <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />;
    return <XCircleIcon className="h-6 w-6 text-red-600" />;
  };

  const getRegulatoryLevelColor = (level: string) => {
    switch (level) {
      case 'federal': return 'blue';
      case 'state': return 'orange';
      case 'federal_state': return 'teal';
      default: return 'gray';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Regulatory Compliance Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-white to-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Regulatory Compliance</h3>
            {getComplianceIcon(categorizationSummary.regulatory_compliance_score)}
          </div>
          
          <div className="text-center">
            <div className={`text-4xl font-bold ${getComplianceColor(categorizationSummary.regulatory_compliance_score)}`}>
              {categorizationSummary.regulatory_compliance_score}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Based on {categorizationSummary.red_flags_summary.total} red flags analyzed
            </p>
          </div>

          {/* Compliance breakdown */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Items Categorized:</span>
              <span className="font-medium">{categorizationSummary.total_categorized_items}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Benefits:</span>
              <span className="font-medium text-green-600">{categorizationSummary.benefits_summary.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Red Flags:</span>
              <span className="font-medium text-red-600">{categorizationSummary.red_flags_summary.total}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Regulatory Level Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-white to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Regulatory Coverage</h3>
            <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {Object.entries(categorizationSummary.benefits_summary.by_regulatory_level).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={getRegulatoryLevelColor(level)} size="sm">
                    {formatCategoryName(level)}
                  </Badge>
                </div>
                <span className="font-medium text-gray-900">{count} benefits</span>
              </div>
            ))}
          </div>

          {/* Red flags by regulatory level */}
          {Object.keys(categorizationSummary.red_flags_summary.by_regulatory_level).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Red Flags by Level:</h4>
              <div className="space-y-2">
                {Object.entries(categorizationSummary.red_flags_summary.by_regulatory_level).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between text-sm">
                    <Badge variant={getRegulatoryLevelColor(level)} size="sm">
                      {formatCategoryName(level)}
                    </Badge>
                    <span className="text-red-600 font-medium">{count} issues</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Top Regulatory Concerns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6 bg-gradient-to-br from-white to-red-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Concerns</h3>
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
          </div>

          {categorizationSummary.top_regulatory_concerns.length > 0 ? (
            <div className="space-y-2">
              {categorizationSummary.top_regulatory_concerns.map((concern, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{concern}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No major regulatory concerns detected</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Coverage Gaps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-white to-yellow-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Coverage Gaps</h3>
            <TrendingUpIcon className="h-6 w-6 text-yellow-600" />
          </div>

          {categorizationSummary.coverage_gaps.length > 0 ? (
            <div className="space-y-2">
              {categorizationSummary.coverage_gaps.map((gap, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{gap}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No significant coverage gaps identified</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default CategorizationSummaryCard;
