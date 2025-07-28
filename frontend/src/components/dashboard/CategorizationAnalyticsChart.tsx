import React, { useState } from 'react';
import { Card, Button, Badge } from '../ui/DesignSystem';
import { motion } from 'framer-motion';
import { BarChart3Icon, PieChartIcon, TrendingUpIcon } from 'lucide-react';

interface CategorizationAnalyticsProps {
  categorizationSummary: {
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
  };
}

type ChartType = 'benefits_category' | 'benefits_regulatory' | 'redflags_risk' | 'redflags_category';

const CategorizationAnalyticsChart: React.FC<CategorizationAnalyticsProps> = ({
  categorizationSummary
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>('benefits_category');

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getColorForCategory = (category: string, index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500',
      'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500', 'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  const getRegulatoryLevelColor = (level: string) => {
    switch (level) {
      case 'federal': return 'bg-blue-500';
      case 'state': return 'bg-orange-500';
      case 'federal_state': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const renderBarChart = (data: Record<string, number>, getColor: (key: string, index: number) => string) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className="w-24 text-sm text-gray-600 truncate">
              {formatCategoryName(key)}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / maxValue) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-4 rounded-full ${getColor(key, index)}`}
              />
            </div>
            <div className="w-12 text-sm font-medium text-gray-900 text-right">
              {value}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const getChartData = () => {
    switch (activeChart) {
      case 'benefits_category':
        return {
          title: 'Benefits by Category',
          data: categorizationSummary.benefits_summary.by_prominent_category,
          getColor: getColorForCategory
        };
      case 'benefits_regulatory':
        return {
          title: 'Benefits by Regulatory Level',
          data: categorizationSummary.benefits_summary.by_regulatory_level,
          getColor: getRegulatoryLevelColor
        };
      case 'redflags_risk':
        return {
          title: 'Red Flags by Risk Level',
          data: categorizationSummary.red_flags_summary.by_risk_level,
          getColor: getRiskLevelColor
        };
      case 'redflags_category':
        return {
          title: 'Red Flags by Category',
          data: categorizationSummary.red_flags_summary.by_prominent_category,
          getColor: getColorForCategory
        };
      default:
        return {
          title: 'Benefits by Category',
          data: categorizationSummary.benefits_summary.by_prominent_category,
          getColor: getColorForCategory
        };
    }
  };

  const chartData = getChartData();
  const hasData = Object.keys(chartData.data).length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3Icon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Categorization Analytics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeChart.startsWith('benefits') ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('benefits_category')}
          >
            Benefits
          </Button>
          <Button
            variant={activeChart.startsWith('redflags') ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('redflags_risk')}
          >
            Red Flags
          </Button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {activeChart.startsWith('benefits') ? (
          <>
            <Button
              variant={activeChart === 'benefits_category' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('benefits_category')}
            >
              By Category
            </Button>
            <Button
              variant={activeChart === 'benefits_regulatory' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('benefits_regulatory')}
            >
              By Regulatory Level
            </Button>
          </>
        ) : (
          <>
            <Button
              variant={activeChart === 'redflags_risk' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('redflags_risk')}
            >
              By Risk Level
            </Button>
            <Button
              variant={activeChart === 'redflags_category' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('redflags_category')}
            >
              By Category
            </Button>
          </>
        )}
      </div>

      {/* Chart Content */}
      <div className="min-h-[300px]">
        <h4 className="text-md font-medium text-gray-800 mb-4">{chartData.title}</h4>
        
        {hasData ? (
          renderBarChart(chartData.data, chartData.getColor)
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No data available</p>
              <p className="text-sm">Data will appear here once policies are categorized</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {hasData && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {Object.keys(chartData.data).length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(chartData.data).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.max(...Object.values(chartData.data))}
              </div>
              <div className="text-sm text-gray-600">Highest Count</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(Object.values(chartData.data).reduce((a, b) => a + b, 0) / Object.keys(chartData.data).length)}
              </div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CategorizationAnalyticsChart;
