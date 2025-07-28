import React, { useState, useEffect } from 'react';
import { 
  ChartContainer, 
  CustomPieChart, 
  CustomBarChart, 
  MetricCard 
} from '../charts/ChartComponents';
import { 
  analyticsService, 
  CarrierDistribution,
  CarrierPerformance,
  AnalyticsSummary 
} from '../../services/analyticsService';

export function CarrierAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carrierDistribution, setCarrierDistribution] = useState<CarrierDistribution[]>([]);
  const [carrierPerformance, setCarrierPerformance] = useState<CarrierPerformance[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [distributionData, performanceData, summaryData] = await Promise.all([
        analyticsService.getCarrierDistribution(),
        analyticsService.getCarrierPerformance(),
        analyticsService.getAnalyticsSummary()
      ]);

      setCarrierDistribution(distributionData);
      setCarrierPerformance(performanceData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading carrier analytics:', err);
      setError('Failed to load carrier analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatProcessingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTopPerformer = () => {
    if (!carrierPerformance.length) return null;
    return carrierPerformance.reduce((top, carrier) => 
      carrier.success_rate > top.success_rate ? carrier : top
    );
  };

  const getMostActive = () => {
    if (!carrierDistribution.length) return null;
    return carrierDistribution.reduce((most, carrier) => 
      carrier.policy_count > most.policy_count ? carrier : most
    );
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

  const topPerformer = getTopPerformer();
  const mostActive = getMostActive();

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Carriers"
            value={summary.total_carriers}
            subtitle="Registered insurance carriers"
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <MetricCard
            title="Active Carriers"
            value={summary.active_carriers}
            subtitle="Currently active"
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Top Performer"
            value={topPerformer ? `${topPerformer.success_rate}%` : 'N/A'}
            subtitle={topPerformer ? topPerformer.carrier_name : 'No data'}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <MetricCard
            title="Most Active"
            value={mostActive ? mostActive.policy_count : 0}
            subtitle={mostActive ? `${mostActive.carrier_name} policies` : 'No data'}
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carrier Distribution Pie Chart */}
        <ChartContainer
          title="Policy Distribution by Carrier"
          subtitle="Percentage of policies per carrier"
        >
          <CustomPieChart
            data={carrierDistribution.map(item => ({
              name: item.carrier_code,
              value: item.policy_count,
              color: item.color,
              percentage: item.percentage
            }))}
            showLegend={true}
            showLabels={true}
          />
        </ChartContainer>

        {/* Carrier Policy Count Bar Chart */}
        <ChartContainer
          title="Policies by Carrier"
          subtitle="Number of policies per carrier"
        >
          <CustomBarChart
            data={carrierDistribution.map(item => ({
              name: item.carrier_code,
              value: item.policy_count,
              color: item.color
            }))}
            color="#3B82F6"
          />
        </ChartContainer>
      </div>

      {/* Carrier Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Carrier Performance Metrics</h3>
          <p className="text-sm text-gray-600 mt-1">Detailed performance statistics for each carrier</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Processing Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {carrierPerformance.map((carrier, index) => (
                <tr key={carrier.carrier_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{carrier.carrier_name}</div>
                      <div className="text-sm text-gray-500">{carrier.carrier_code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {carrier.total_policies.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {carrier.total_documents.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{carrier.success_rate}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            carrier.success_rate >= 90 ? 'bg-green-500' :
                            carrier.success_rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${carrier.success_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatProcessingTime(carrier.avg_processing_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      carrier.recent_activity > 5 ? 'bg-green-100 text-green-800' :
                      carrier.recent_activity > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {carrier.recent_activity} items
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
