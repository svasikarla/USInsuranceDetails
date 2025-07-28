import React, { useState } from 'react';
import { Card, Button, Badge } from '../ui/DesignSystem';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  RefreshCwIcon, 
  DownloadIcon, 
  FilterIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from 'lucide-react';

interface CategorizationQuickActionsProps {
  onAutoCategorize: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onExportReport: () => Promise<void>;
  onViewFiltered: (filter: string) => void;
  categorizationSummary: {
    total_categorized_items: number;
    regulatory_compliance_score: number;
    red_flags_summary: {
      total: number;
      by_risk_level: Record<string, number>;
    };
  };
}

const CategorizationQuickActions: React.FC<CategorizationQuickActionsProps> = ({
  onAutoCategorize,
  onRefreshData,
  onExportReport,
  onViewFiltered,
  categorizationSummary
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (actionName: string, action: () => Promise<void>) => {
    setLoading(actionName);
    try {
      await action();
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const getCriticalIssuesCount = () => {
    return (categorizationSummary.red_flags_summary.by_risk_level?.critical || 0) +
           (categorizationSummary.red_flags_summary.by_risk_level?.high || 0);
  };

  const getComplianceStatus = () => {
    const score = categorizationSummary.regulatory_compliance_score;
    if (score >= 90) return { status: 'excellent', color: 'green', icon: CheckCircleIcon };
    if (score >= 70) return { status: 'good', color: 'yellow', icon: ClockIcon };
    return { status: 'needs attention', color: 'red', icon: AlertTriangleIcon };
  };

  const complianceStatus = getComplianceStatus();
  const StatusIcon = complianceStatus.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-5 w-5 text-${complianceStatus.color}-600`} />
          <span className={`text-sm font-medium text-${complianceStatus.color}-600`}>
            {complianceStatus.status.charAt(0).toUpperCase() + complianceStatus.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleAction('auto-categorize', onAutoCategorize)}
            disabled={loading === 'auto-categorize'}
            loading={loading === 'auto-categorize'}
            className="w-full h-16 flex flex-col items-center justify-center space-y-1"
          >
            <PlayIcon className="h-5 w-5" />
            <span className="text-sm">Auto-Categorize All</span>
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleAction('refresh', onRefreshData)}
            disabled={loading === 'refresh'}
            loading={loading === 'refresh'}
            className="w-full h-16 flex flex-col items-center justify-center space-y-1"
          >
            <RefreshCwIcon className="h-5 w-5" />
            <span className="text-sm">Refresh Data</span>
          </Button>
        </motion.div>
      </div>

      {/* Filter Actions */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Quick Filters</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewFiltered('high-risk')}
            className="flex items-center justify-between"
          >
            <span>High Risk Issues</span>
            <Badge variant="danger" size="sm">
              {getCriticalIssuesCount()}
            </Badge>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewFiltered('federal')}
            className="flex items-center justify-between"
          >
            <span>Federal Issues</span>
            <FilterIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewFiltered('uncategorized')}
            className="flex items-center justify-between"
          >
            <span>Uncategorized</span>
            <Badge variant="warning" size="sm">
              Review
            </Badge>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewFiltered('coverage-gaps')}
            className="flex items-center justify-between"
          >
            <span>Coverage Gaps</span>
            <AlertTriangleIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Export Actions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Export & Reports</h4>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('export', onExportReport)}
            disabled={loading === 'export'}
            loading={loading === 'export'}
            className="flex items-center space-x-2"
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-indigo-600">
              {categorizationSummary.total_categorized_items}
            </div>
            <div className="text-xs text-gray-600">Items Categorized</div>
          </div>
          <div>
            <div className={`text-lg font-bold text-${complianceStatus.color}-600`}>
              {categorizationSummary.regulatory_compliance_score}%
            </div>
            <div className="text-xs text-gray-600">Compliance Score</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {categorizationSummary.red_flags_summary.total}
            </div>
            <div className="text-xs text-gray-600">Red Flags</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CategorizationQuickActions;
