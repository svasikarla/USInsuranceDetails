import React, { useState, useEffect } from 'react';
import { 
  ChartContainer, 
  CustomPieChart, 
  CustomBarChart, 
  CustomLineChart,
  MetricCard 
} from '../charts/ChartComponents';
import { 
  analyticsService, 
  PolicyDistribution, 
  PremiumAnalytics,
  AnalyticsSummary 
} from '../../services/analyticsService';

export function PolicyAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policyDistribution, setPolicyDistribution] = useState<PolicyDistribution[]>([]);
  const [premiumAnalytics, setPremiumAnalytics] = useState<PremiumAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [distributionData, premiumData, summaryData] = await Promise.all([
        analyticsService.getPolicyDistribution(),
        analyticsService.getPremiumAnalytics(),
        analyticsService.getAnalyticsSummary()
      ]);

      setPolicyDistribution(distributionData);
      setPremiumAnalytics(premiumData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading policy analytics:', err);
      setError('Failed to load policy analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
            title="Total Policies"
            value={summary.total_policies.toLocaleString()}
            subtitle="Active insurance policies"
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <MetricCard
            title="Average Premium"
            value={formatCurrency(summary.avg_premium)}
            subtitle="Per policy average"
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          <MetricCard
            title="Total Premium Value"
            value={formatCurrency(summary.total_premium)}
            subtitle="Combined portfolio value"
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <MetricCard
            title="Active Carriers"
            value={summary.active_carriers}
            subtitle={`of ${summary.total_carriers} total carriers`}
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy Distribution Pie Chart */}
        <ChartContainer
          title="Policy Distribution by Type"
          subtitle="Breakdown of policies by insurance type"
        >
          <CustomPieChart
            data={policyDistribution.map(item => ({
              name: item.type,
              value: item.count,
              color: item.color,
              percentage: item.percentage
            }))}
            showLegend={true}
            showLabels={true}
          />
        </ChartContainer>

        {/* Policy Type Bar Chart */}
        <ChartContainer
          title="Policy Count by Type"
          subtitle="Number of policies for each insurance type"
        >
          <CustomBarChart
            data={policyDistribution.map(item => ({
              name: item.type,
              value: item.count,
              color: item.color
            }))}
            color="#3B82F6"
          />
        </ChartContainer>
      </div>

      {/* Premium Analytics */}
      {premiumAnalytics.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <ChartContainer
            title="Premium Analytics Over Time"
            subtitle="Monthly premium trends and policy counts"
            className="col-span-full"
          >
            <CustomLineChart
              data={premiumAnalytics.map(item => ({
                name: formatMonth(item.month),
                'Total Premium': item.total_premium,
                'Average Premium': item.average_premium,
                'Policy Count': item.policy_count * 100 // Scale for visibility
              }))}
              lines={[
                { key: 'Total Premium', color: '#3B82F6', name: 'Total Premium ($)' },
                { key: 'Average Premium', color: '#10B981', name: 'Average Premium ($)' },
                { key: 'Policy Count', color: '#F59E0B', name: 'Policy Count (×100)' }
              ]}
            />
          </ChartContainer>
        </div>
      )}

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
