import React, { useState, useEffect } from 'react';
import { 
  ChartContainer, 
  CustomPieChart, 
  CustomBarChart, 
  CustomAreaChart,
  MetricCard 
} from '../charts/ChartComponents';
import { 
  analyticsService, 
  DocumentProcessingStats,
  TrendData,
  AnalyticsSummary 
} from '../../services/analyticsService';

export function DocumentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStats, setProcessingStats] = useState<DocumentProcessingStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, trendsData, summaryData] = await Promise.all([
        analyticsService.getDocumentProcessingStats(),
        analyticsService.getTrendData(30),
        analyticsService.getAnalyticsSummary()
      ]);

      setProcessingStats(statsData);
      setTrendData(trendsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading document analytics:', err);
      setError('Failed to load document analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getProcessingSuccessRate = () => {
    if (!processingStats.length) return 0;
    const completed = processingStats.find(s => s.status.toLowerCase() === 'completed');
    const total = processingStats.reduce((sum, s) => sum + s.count, 0);
    return total > 0 ? Math.round(((completed?.count || 0) / total) * 100) : 0;
  };

  const getAverageProcessingTime = () => {
    // Mock calculation - in real app this would come from actual processing times
    return Math.round(Math.random() * 120 + 30); // 30-150 seconds
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Documents"
            value={summary.total_documents.toLocaleString()}
            subtitle="Uploaded documents"
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <MetricCard
            title="Processing"
            value={summary.processing_documents}
            subtitle="Currently being processed"
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />
          <MetricCard
            title="Success Rate"
            value={`${getProcessingSuccessRate()}%`}
            subtitle="Successfully processed"
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Avg Processing Time"
            value={`${getAverageProcessingTime()}s`}
            subtitle="Per document"
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Status Pie Chart */}
        <ChartContainer
          title="Document Processing Status"
          subtitle="Current status of all documents"
        >
          <CustomPieChart
            data={processingStats.map(item => ({
              name: item.status,
              value: item.count,
              color: item.color,
              percentage: item.percentage
            }))}
            showLegend={true}
            showLabels={true}
          />
        </ChartContainer>

        {/* Processing Status Bar Chart */}
        <ChartContainer
          title="Processing Status Breakdown"
          subtitle="Document count by processing status"
        >
          <CustomBarChart
            data={processingStats.map(item => ({
              name: item.status,
              value: item.count,
              color: item.color
            }))}
            color="#3B82F6"
          />
        </ChartContainer>
      </div>

      {/* Document Upload Trends */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <ChartContainer
            title="Document Upload Trends (Last 30 Days)"
            subtitle="Daily document uploads and processing activity"
            className="col-span-full"
          >
            <CustomAreaChart
              data={trendData.map(item => ({
                name: formatDate(item.date),
                'Documents': item.documents,
                'Policies': item.policies
              }))}
              areas={[
                { key: 'Documents', color: '#3B82F6', name: 'Documents Uploaded' },
                { key: 'Policies', color: '#10B981', name: 'Policies Created' }
              ]}
              stacked={false}
            />
          </ChartContainer>
        </div>
      )}

      {/* Processing Pipeline Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Pipeline Status</h3>
        <div className="space-y-4">
          {processingStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: stat.color }}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{stat.status}</p>
                  <p className="text-sm text-gray-600">{stat.count} documents</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{stat.percentage}%</p>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.color 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
