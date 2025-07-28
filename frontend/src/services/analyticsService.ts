import apiService from './apiService';
import { InsurancePolicy, PolicyDocument, InsuranceCarrier } from '../types/api';

export interface PolicyDistribution {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CarrierDistribution {
  carrier_name: string;
  carrier_code: string;
  policy_count: number;
  document_count: number;
  percentage: number;
  color: string;
}

export interface PremiumAnalytics {
  month: string;
  total_premium: number;
  average_premium: number;
  policy_count: number;
}

export interface DocumentProcessingStats {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TrendData {
  date: string;
  policies: number;
  documents: number;
  carriers: number;
}

export interface CarrierPerformance {
  carrier_id: string;
  carrier_name: string;
  carrier_code: string;
  total_policies: number;
  total_documents: number;
  avg_processing_time: number;
  success_rate: number;
  recent_activity: number;
}

export interface AnalyticsSummary {
  total_policies: number;
  total_documents: number;
  total_carriers: number;
  active_carriers: number;
  processing_documents: number;
  failed_documents: number;
  avg_premium: number;
  total_premium: number;
}

class AnalyticsService {
  private readonly POLICY_TYPE_COLORS = {
    'health': '#3B82F6',
    'dental': '#10B981',
    'vision': '#8B5CF6',
    'life': '#F59E0B',
    'disability': '#EF4444',
    'other': '#6B7280'
  };

  private readonly PROCESSING_STATUS_COLORS = {
    'completed': '#10B981',
    'processing': '#F59E0B',
    'failed': '#EF4444',
    'pending': '#6B7280'
  };

  private readonly CARRIER_COLORS = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const [policies, documents, carriers] = await Promise.all([
        apiService.policyApi.getPolicies(),
        apiService.documentApi.getDocuments(),
        apiService.carrierApi.getCarriers()
      ]);

      const activeCarriers = carriers.filter((c: InsuranceCarrier) => c.is_active).length;
      const documentsAwaitingProcessing = documents.filter((d: PolicyDocument) => d.processing_status === 'pending').length;
      const documentsWithErrors = documents.filter((d: PolicyDocument) => d.processing_status === 'failed').length;
      const totalPremiums = policies.reduce((sum: number, p: InsurancePolicy) => sum + (p.premium_monthly || 0), 0);
      const avgPremium = policies.length > 0 ? totalPremiums / policies.length : 0;

      return {
        total_policies: policies.length,
        total_documents: documents.length,
        total_carriers: carriers.length,
        active_carriers: activeCarriers,
        processing_documents: documentsAwaitingProcessing,
        failed_documents: documentsWithErrors,
        avg_premium: avgPremium,
        total_premium: totalPremiums
      };
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  }

  async getPolicyDistribution(): Promise<PolicyDistribution[]> {
    try {
      const policies = await apiService.policyApi.getPolicies();
      const distribution = new Map<string, number>();

      policies.forEach((policy: InsurancePolicy) => {
        const type = policy.policy_type || 'other';
        distribution.set(type, (distribution.get(type) || 0) + 1);
      });

      const total = policies.length;
      return Array.from(distribution.entries()).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: this.POLICY_TYPE_COLORS[type as keyof typeof this.POLICY_TYPE_COLORS] || this.POLICY_TYPE_COLORS.other
      }));
    } catch (error) {
      console.error('Error fetching policy distribution:', error);
      throw error;
    }
  }

  async getCarrierDistribution(): Promise<CarrierDistribution[]> {
    try {
      const [policies, documents, carriers] = await Promise.all([
        apiService.policyApi.getPolicies(),
        apiService.documentApi.getDocuments(),
        apiService.carrierApi.getCarriers()
      ]);

      const carrierMap = new Map<string, InsuranceCarrier>(carriers.map((c: InsuranceCarrier) => [c.id, c]));
      const carrierPolicyCount = policies.reduce((acc: Map<string, number>, policy: InsurancePolicy) => {
        const carrierId = policy.carrier_id;
        if (carrierId) {
          acc.set(carrierId, (acc.get(carrierId) || 0) + 1);
        }
        return acc;
      }, new Map<string, number>());

      const carrierDocumentCount = documents.reduce((acc: Map<string, number>, doc: PolicyDocument) => {
        const policy = policies.find((p: InsurancePolicy) => p.id === doc.policy_id);
        if (policy && policy.carrier_id) {
          const carrierId = policy.carrier_id;
          acc.set(carrierId, (acc.get(carrierId) || 0) + 1);
        }
        return acc;
      }, new Map<string, number>());

      const totalPolicies = policies.length;
      return Array.from(carrierPolicyCount.entries())
        .map(([carrierId, policyCount], index) => {
          const carrierDetails = carrierMap.get(carrierId);
          const carrierName = carrierDetails?.name || 'Unknown';
          const carrierCode = carrierDetails?.code || 'N/A';
          const documentCount = carrierDocumentCount.get(carrierId) || 0;

          return {
            carrier_name: carrierName,
            carrier_code: carrierCode,
            policy_count: policyCount,
            document_count: documentCount,
            percentage: totalPolicies > 0 ? Math.round((policyCount / totalPolicies) * 100) : 0,
            color: this.CARRIER_COLORS[index % this.CARRIER_COLORS.length]
          };
        })
        .sort((a, b) => b.policy_count - a.policy_count);
    } catch (error) {
      console.error('Error fetching carrier distribution:', error);
      throw error;
    }
  }

  async getPremiumAnalytics(): Promise<PremiumAnalytics[]> {
    try {
      const policies = await apiService.policyApi.getPolicies();
      const monthlyData = new Map<string, { total: number; count: number }>();

      policies.forEach((policy: InsurancePolicy) => {
        if (policy.effective_date && policy.premium_monthly) {
          const month = policy.effective_date.substring(0, 7); // YYYY-MM
          const data = monthlyData.get(month) || { total: 0, count: 0 };
          data.total += policy.premium_monthly;
          data.count += 1;
          monthlyData.set(month, data);
        }
      });

      return Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          total_premium: data.total,
          average_premium: data.count > 0 ? data.total / data.count : 0,
          policy_count: data.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months
    } catch (error) {
      console.error('Error fetching premium analytics:', error);
      throw error;
    }
  }

  async getDocumentProcessingStats(): Promise<DocumentProcessingStats[]> {
    try {
      const documents = await apiService.documentApi.getDocuments();
      const statusCounts = new Map<string, number>();

      documents.forEach((doc: PolicyDocument) => {
        const status = doc.processing_status || 'pending';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const total = documents.length;
      return Array.from(statusCounts.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: this.PROCESSING_STATUS_COLORS[status as keyof typeof this.PROCESSING_STATUS_COLORS] || this.PROCESSING_STATUS_COLORS.pending
      }));
    } catch (error) {
      console.error('Error fetching document processing stats:', error);
      throw error;
    }
  }

  async getTrendData(days: number = 30): Promise<TrendData[]> {
    try {
      const [policies, documents, carriers] = await Promise.all([
        apiService.policyApi.getPolicies(),
        apiService.documentApi.getDocuments(),
        apiService.carrierApi.getCarriers()
      ]);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const trendData: TrendData[] = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        const policiesForDate = policies.filter((p: InsurancePolicy) => p.created_at.startsWith(dateStr));
        const documentsForDate = documents.filter((d: PolicyDocument) => d.created_at.startsWith(dateStr));
        const carriersForDate = carriers.filter((c: InsuranceCarrier) => c.created_at.startsWith(dateStr));

        trendData.push({
          date: dateStr,
          policies: policiesForDate.length,
          documents: documentsForDate.length,
          carriers: carriersForDate.length
        });
      }

      return trendData;
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  async getCarrierPerformance(): Promise<CarrierPerformance[]> {
    try {
      const [policies, documents, carriers] = await Promise.all([
        apiService.policyApi.getPolicies(),
        apiService.documentApi.getDocuments(),
        apiService.carrierApi.getCarriers()
      ]);

      return carriers.map((carrier: InsuranceCarrier, index: number) => {
        const policiesForCarrier = policies.filter((p: InsurancePolicy) => p.carrier_id === carrier.id);
        const documentsForCarrier = documents.filter((d: PolicyDocument) => policiesForCarrier.some((p: InsurancePolicy) => p.id === d.policy_id));

        const completedDocs = documentsForCarrier.filter((d: PolicyDocument) => d.processing_status === 'completed');
        const successRate = documentsForCarrier.length > 0 ? 
          (completedDocs.length / documentsForCarrier.length) * 100 : 0;

        // Calculate average processing time (mock calculation)
        const avgProcessingTime = documentsForCarrier.length > 0 ? 
          Math.random() * 300 + 60 : 0; // 1-5 minutes mock

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentActivity = [
          ...policiesForCarrier.filter((p: InsurancePolicy) => p.created_at && new Date(p.created_at) > sevenDaysAgo),
          ...documentsForCarrier.filter((d: PolicyDocument) => d.created_at && new Date(d.created_at) > sevenDaysAgo)
        ].length;

        return {
          carrier_id: carrier.id,
          carrier_name: carrier.name,
          carrier_code: carrier.code,
          total_policies: policiesForCarrier.length,
          total_documents: documentsForCarrier.length,
          avg_processing_time: Math.round(avgProcessingTime),
          success_rate: Math.round(successRate),
          recent_activity: recentActivity
        };
      }).sort((a, b) => b.total_policies - a.total_policies);
    } catch (error) {
      console.error('Error fetching carrier performance:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
