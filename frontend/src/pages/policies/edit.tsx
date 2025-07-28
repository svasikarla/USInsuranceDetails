import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { policyApi, carrierApi } from '../../services/apiService';
import { InsurancePolicy, InsuranceCarrier } from '../../types/api';

interface PolicyUpdateData {
  policy_name?: string;
  policy_type?: 'health' | 'dental' | 'vision' | 'life';
  policy_number?: string;
  plan_year?: string;
  effective_date?: string;
  expiration_date?: string;
  group_number?: string;
  network_type?: 'HMO' | 'PPO' | 'EPO' | 'POS';
  deductible_individual?: number;
  deductible_family?: number;
  out_of_pocket_max_individual?: number;
  out_of_pocket_max_family?: number;
  premium_monthly?: number;
  premium_annual?: number;
  carrier_id?: string;
}

export default function EditPolicyPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [formData, setFormData] = useState<PolicyUpdateData>({});
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadData(id);
    }
  }, [id]);

  const loadData = async (policyId: string) => {
    try {
      setLoading(true);
      
      const [policyData, carriersData] = await Promise.all([
        policyApi.getPolicy(policyId),
        carrierApi.getCarriers()
      ]);
      
      setPolicy(policyData);
      setCarriers(carriersData);
      
      // Initialize form data with current policy values
      setFormData({
        policy_name: policyData.policy_name,
        policy_type: policyData.policy_type,
        policy_number: policyData.policy_number || '',
        plan_year: policyData.plan_year || '',
        effective_date: policyData.effective_date || '',
        expiration_date: policyData.expiration_date || '',
        group_number: policyData.group_number || '',
        network_type: policyData.network_type,
        deductible_individual: policyData.deductible_individual || 0,
        deductible_family: policyData.deductible_family || 0,
        out_of_pocket_max_individual: policyData.out_of_pocket_max_individual || 0,
        out_of_pocket_max_family: policyData.out_of_pocket_max_family || 0,
        premium_monthly: policyData.premium_monthly || 0,
        premium_annual: policyData.premium_annual || 0,
        carrier_id: policyData.carrier_id || ''
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading policy data:', err);
      setError(err.message || 'Failed to load policy data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PolicyUpdateData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.policy_name?.trim()) {
      newErrors.policy_name = 'Policy name is required';
    }
    
    if (!formData.policy_type) {
      newErrors.policy_type = 'Policy type is required';
    }
    
    if (formData.deductible_individual && formData.deductible_individual < 0) {
      newErrors.deductible_individual = 'Deductible cannot be negative';
    }
    
    if (formData.deductible_family && formData.deductible_family < 0) {
      newErrors.deductible_family = 'Deductible cannot be negative';
    }
    
    if (formData.premium_monthly && formData.premium_monthly < 0) {
      newErrors.premium_monthly = 'Premium cannot be negative';
    }
    
    if (formData.premium_annual && formData.premium_annual < 0) {
      newErrors.premium_annual = 'Premium cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !policy) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Filter out empty strings and convert to appropriate types
      const updateData: PolicyUpdateData = {};
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (typeof value === 'string' && value.trim() === '') {
            return; // Skip empty strings
          }
          updateData[key as keyof PolicyUpdateData] = value;
        }
      });
      
      await policyApi.updatePolicy(policy.id, updateData);
      
      // Redirect back to policy detail page
      router.push(`/policies/${policy.id}`);
      
    } catch (err: any) {
      console.error('Error updating policy:', err);
      setError(err.message || 'Failed to update policy');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading policy data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !policy) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Policy</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!policy) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Policy Not Found</h1>
            <p className="text-gray-600 mb-4">The requested policy could not be found.</p>
            <Link
              href="/policies"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Policies
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <Link href="/policies" className="hover:text-gray-700">Policies</Link>
                  <span>/</span>
                  <Link href={`/policies/${policy.id}`} className="hover:text-gray-700">{policy.policy_name}</Link>
                  <span>/</span>
                  <span>Edit</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Policy</h1>
                <p className="text-gray-600">Update policy information and details</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href={`/policies/${policy.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-400 text-xl mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Name *
                    </label>
                    <input
                      type="text"
                      value={formData.policy_name || ''}
                      onChange={(e) => handleInputChange('policy_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.policy_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter policy name"
                    />
                    {errors.policy_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.policy_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Type *
                    </label>
                    <select
                      value={formData.policy_type || ''}
                      onChange={(e) => handleInputChange('policy_type', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.policy_type ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select policy type</option>
                      <option value="health">Health Insurance</option>
                      <option value="dental">Dental Insurance</option>
                      <option value="vision">Vision Insurance</option>
                      <option value="life">Life Insurance</option>
                    </select>
                    {errors.policy_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.policy_type}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={formData.policy_number || ''}
                      onChange={(e) => handleInputChange('policy_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter policy number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Year
                    </label>
                    <input
                      type="text"
                      value={formData.plan_year || ''}
                      onChange={(e) => handleInputChange('plan_year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={formData.effective_date || ''}
                      onChange={(e) => handleInputChange('effective_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiration_date || ''}
                      onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Carrier
                    </label>
                    <select
                      value={formData.carrier_id || ''}
                      onChange={(e) => handleInputChange('carrier_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select carrier</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network Type
                    </label>
                    <select
                      value={formData.network_type || ''}
                      onChange={(e) => handleInputChange('network_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select network type</option>
                      <option value="HMO">HMO</option>
                      <option value="PPO">PPO</option>
                      <option value="EPO">EPO</option>
                      <option value="POS">POS</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Individual Deductible ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deductible_individual || ''}
                      onChange={(e) => handleInputChange('deductible_individual', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.deductible_individual ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.deductible_individual && (
                      <p className="mt-1 text-sm text-red-600">{errors.deductible_individual}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Deductible ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deductible_family || ''}
                      onChange={(e) => handleInputChange('deductible_family', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.deductible_family ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.deductible_family && (
                      <p className="mt-1 text-sm text-red-600">{errors.deductible_family}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Premium ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.premium_monthly || ''}
                      onChange={(e) => handleInputChange('premium_monthly', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.premium_monthly ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.premium_monthly && (
                      <p className="mt-1 text-sm text-red-600">{errors.premium_monthly}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Premium ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.premium_annual || ''}
                      onChange={(e) => handleInputChange('premium_annual', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.premium_annual ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.premium_annual && (
                      <p className="mt-1 text-sm text-red-600">{errors.premium_annual}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href={`/policies/${policy.id}`}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
