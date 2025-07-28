import { apiClient } from './apiClient';
import {
  InsurancePolicy,
  InsurancePolicyCreate,
  InsuranceCarrier,
  PolicyDocument,
  PolicyDocumentWithText,
  CoverageBenefit,
  RedFlag,
  DashboardStats,
  PaginatedResponse,
  PolicyFilters,
  DocumentFilters
} from '../types/api';

// Define missing types for carriers
interface CarrierFilters {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

interface InsuranceCarrierCreate {
  name: string;
  code: string;
  api_endpoint?: string;
  contact_email?: string;
  phone_number?: string;
  is_active?: boolean;
}

interface InsuranceCarrierUpdate {
  name?: string;
  code?: string;
  api_endpoint?: string;
  contact_email?: string;
  phone_number?: string;
  is_active?: boolean;
}

interface CarrierStats {
  total_policies: number;
  total_documents: number;
  active_policies: number;
  recent_activity: number;
}

// Policy API
export const policyApi = {
  // Get all policies for current user
  async getPolicies(filters?: PolicyFilters): Promise<InsurancePolicy[]> {
    const params = new URLSearchParams();
    if (filters?.policy_type) params.append('policy_type', filters.policy_type);
    if (filters?.carrier_id) params.append('carrier_id', filters.carrier_id);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/api/policies?${params.toString()}`);
    return response.data;
  },

  // Get single policy by ID
  async getPolicy(policyId: string): Promise<InsurancePolicy> {
    const response = await apiClient.get(`/api/policies/${policyId}`);
    return response.data;
  },

  // Create new policy
  async createPolicy(policy: InsurancePolicyCreate): Promise<InsurancePolicy> {
    const response = await apiClient.post('/api/policies', policy);
    return response.data;
  },

  // Update policy
  async updatePolicy(policyId: string, policyData: any): Promise<InsurancePolicy> {
    const response = await apiClient.put(`/api/policies/${policyId}`, policyData);
    return response.data;
  },

  // Delete policy
  async deletePolicy(policyId: string): Promise<void> {
    await apiClient.delete(`/api/policies/${policyId}`);
  },

  // Get benefits for policy
  async getPolicyBenefits(policyId: string): Promise<CoverageBenefit[]> {
    const response = await apiClient.get(`/api/policies/${policyId}/benefits`);
    return response.data;
  },

  // Get red flags for policy
  async getRedFlags(policyId: string): Promise<RedFlag[]> {
    const response = await apiClient.get(`/api/policies/${policyId}/red-flags`);
    return response.data || [];
  }
};

// Document API
export const documentApi = {
  // Get all documents for current user
  async getDocuments(filters?: DocumentFilters): Promise<PolicyDocument[]> {
    const params = new URLSearchParams();
    if (filters?.processing_status) params.append('processing_status', filters.processing_status);
    if (filters?.carrier_id) params.append('carrier_id', filters.carrier_id);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/api/documents?${params.toString()}`);
    return response.data;
  },

  // Get single document by ID
  async getDocument(documentId: string): Promise<PolicyDocumentWithText> {
    const response = await apiClient.get(`/api/documents/${documentId}`);
    return response.data;
  },

  // Upload new document
  async uploadDocument(file: File, carrierID?: string): Promise<PolicyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (carrierID) {
      formData.append('carrier_id', carrierID);
    }

    const response = await apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete(`/api/documents/${documentId}`);
  },

  // Bulk delete documents
  async bulkDeleteDocuments(documentIds: string[]): Promise<void> {
    // Since there's no bulk delete endpoint, delete one by one
    await Promise.all(documentIds.map(id => this.deleteDocument(id)));
  },

  // Get document policy status
  async getDocumentPolicyStatus(documentId: string): Promise<any> {
    const response = await apiClient.get(`/api/documents/${documentId}/policy-status`);
    return response.data;
  },

  // Trigger automatic policy creation
  async triggerPolicyCreation(documentId: string, forceCreation: boolean = false): Promise<any> {
    const response = await apiClient.post(`/api/documents/${documentId}/create-policy`, {
      force_creation: forceCreation
    });
    return response.data;
  },

  // Get extracted policy data for review
  async getExtractedPolicyData(documentId: string): Promise<any> {
    const response = await apiClient.get(`/api/documents/${documentId}/extracted-policy-data`);
    return response.data;
  },

  // Create policy from reviewed data
  async createPolicyFromReview(documentId: string, policyData: any): Promise<any> {
    const response = await apiClient.post(`/api/documents/${documentId}/create-policy-from-review`, policyData);
    return response.data;
  },

  // Get document processing status (for polling)
  async getDocumentStatus(documentId: string): Promise<{ processing_status: string; processing_error?: string }> {
    const response = await apiClient.get(`/api/documents/${documentId}`);
    return {
      processing_status: response.data.processing_status,
      processing_error: response.data.processing_error
    };
  },

  // Download document (if backend supports it)
  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await apiClient.get(`/api/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Carrier API
export const carrierApi = {
  // Get all carriers with optional filtering
  async getCarriers(filters?: CarrierFilters): Promise<InsuranceCarrier[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/api/carriers?${params.toString()}`);
    return response.data;
  },

  // Get single carrier by ID
  async getCarrier(carrierId: string): Promise<InsuranceCarrier> {
    const response = await apiClient.get(`/api/carriers/${carrierId}`);
    return response.data;
  },

  // Create new carrier (admin only)
  async createCarrier(carrier: InsuranceCarrierCreate): Promise<InsuranceCarrier> {
    const response = await apiClient.post('/api/carriers', carrier);
    return response.data;
  },

  // Update carrier (admin only)
  async updateCarrier(carrierId: string, carrier: InsuranceCarrierUpdate): Promise<InsuranceCarrier> {
    const response = await apiClient.put(`/api/carriers/${carrierId}`, carrier);
    return response.data;
  },

  // Delete carrier (admin only)
  async deleteCarrier(carrierId: string): Promise<void> {
    await apiClient.delete(`/api/carriers/${carrierId}`);
  },

  // Get carrier statistics
  async getCarrierStats(carrierId: string): Promise<CarrierStats> {
    // Since there's no specific stats endpoint, we'll aggregate data
    const [policies, documents] = await Promise.all([
      policyApi.getPolicies({ carrier_id: carrierId }),
      documentApi.getDocuments({ carrier_id: carrierId })
    ]);

    return {
      total_policies: policies.length,
      total_documents: documents.length,
      active_policies: policies.filter(p => p.effective_date && new Date(p.effective_date) <= new Date()).length,
      recent_activity: Math.max(policies.length, documents.length) // Simple activity metric
    };
  }
};

// Dashboard API
export const dashboardApi = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/api/dashboard/summary');
    return response.data;
  }
};

// Search API
export const searchApi = {
  globalSearch: async (query: string, limit = 20, page = 1, types?: string[]) => {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      page: page.toString()
    });

    if (types) {
      types.forEach(type => params.append('types', type));
    }

    const response = await apiClient.get(`/api/search/global?${params.toString()}`);
    return response.data;
  },

  advancedSearch: async (filters: any) => {
    const response = await apiClient.post('/api/search/advanced', filters);
    return response.data;
  },

  quickSearch: async (query: string, limit = 8) => {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    const response = await apiClient.get(`/api/search/quick?${params.toString()}`);
    return response.data;
  },

  getSearchSuggestions: async (query = '', limit = 5) => {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    const response = await apiClient.get(`/api/search/suggestions?${params.toString()}`);
    return response.data;
  }
};

export default {
  policyApi,
  documentApi,
  carrierApi,
  dashboardApi,
  searchApi
};
