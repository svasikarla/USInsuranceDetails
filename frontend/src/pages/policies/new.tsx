import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { policyApi, carrierApi, documentApi } from '../../services/apiService';
import { InsurancePolicyCreate, InsuranceCarrier, PolicyDocument } from '../../types/api';

export default function CreatePolicyPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<InsurancePolicyCreate>({
    document_id: '',
    policy_name: '',
    policy_type: undefined,
    policy_number: '',
    plan_year: '',
    effective_date: '',
    expiration_date: '',
    group_number: '',
    network_type: undefined,
    deductible_individual: undefined,
    deductible_family: undefined,
    out_of_pocket_max_individual: undefined,
    out_of_pocket_max_family: undefined,
    premium_monthly: undefined,
    premium_annual: undefined,
    carrier_id: undefined
  });

  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [carriersData, documentsData] = await Promise.all([
        carrierApi.getCarriers(),
        documentApi.getDocuments({ processing_status: 'completed' }) // Only show completed documents
      ]);
      setCarriers(carriersData);
      setDocuments(documentsData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InsurancePolicyCreate, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.document_id) {
      newErrors.document_id = 'Please select a source document';
    }
    if (!formData.policy_name.trim()) {
      newErrors.policy_name = 'Policy name is required';
    }

    // Date validation
    if (formData.effective_date && formData.expiration_date) {
      const effectiveDate = new Date(formData.effective_date);
      const expirationDate = new Date(formData.expiration_date);
      if (effectiveDate >= expirationDate) {
        newErrors.expiration_date = 'Expiration date must be after effective date';
      }
    }

    // Numeric validation
    if (formData.deductible_individual !== undefined && formData.deductible_individual < 0) {
      newErrors.deductible_individual = 'Deductible cannot be negative';
    }
    if (formData.deductible_family !== undefined && formData.deductible_family < 0) {
      newErrors.deductible_family = 'Deductible cannot be negative';
    }
    if (formData.premium_monthly !== undefined && formData.premium_monthly < 0) {
      newErrors.premium_monthly = 'Premium cannot be negative';
    }
    if (formData.premium_annual !== undefined && formData.premium_annual < 0) {
      newErrors.premium_annual = 'Premium cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Clean up form data - remove empty strings and undefined values
      const cleanedData: InsurancePolicyCreate = {
        document_id: formData.document_id,
        policy_name: formData.policy_name.trim(),
        policy_type: formData.policy_type || undefined,
        policy_number: formData.policy_number.trim() || undefined,
        plan_year: formData.plan_year.trim() || undefined,
        effective_date: formData.effective_date || undefined,
        expiration_date: formData.expiration_date || undefined,
        group_number: formData.group_number.trim() || undefined,
        network_type: formData.network_type || undefined,
        deductible_individual: formData.deductible_individual || undefined,
        deductible_family: formData.deductible_family || undefined,
        out_of_pocket_max_individual: formData.out_of_pocket_max_individual || undefined,
        out_of_pocket_max_family: formData.out_of_pocket_max_family || undefined,
        premium_monthly: formData.premium_monthly || undefined,
        premium_annual: formData.premium_annual || undefined,
        carrier_id: formData.carrier_id || undefined
      };

      const newPolicy = await policyApi.createPolicy(cleanedData);
      router.push(`/policies/${newPolicy.id}`);
    } catch (err: any) {
      console.error('Error creating policy:', err);
      setError(err.response?.data?.detail || 'Failed to create policy');
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentDisplayName = (doc: PolicyDocument) => {
    return `${doc.original_filename} (${new Date(doc.created_at).toLocaleDateString()})`;
  };

  const getCurrentYear = () => new Date().getFullYear();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
                  <span>Create New Policy</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Policy</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create a new insurance policy from an uploaded document
                </p>
              </div>
              <Link
                href="/policies"
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {documents.length === 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">
                No processed documents available. Please{' '}
                <Link href="/documents/upload" className="underline">upload a document</Link>{' '}
                first and wait for it to be processed before creating a policy.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Document Selection */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Source Document</h3>
                <p className="text-sm text-gray-600">Select the document this policy is based on</p>
              </div>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.document_id}
                    onChange={(e) => handleInputChange('document_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.document_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={documents.length === 0}
                  >
                    <option value="">Select a document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {getDocumentDisplayName(doc)}
                      </option>
                    ))}
                  </select>
                  {errors.document_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.document_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.policy_name}
                      onChange={(e) => handleInputChange('policy_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      Policy Type
                    </label>
                    <select
                      value={formData.policy_type || ''}
                      onChange={(e) => handleInputChange('policy_type', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type...</option>
                      <option value="health">Health</option>
                      <option value="dental">Dental</option>
                      <option value="vision">Vision</option>
                      <option value="life">Life</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={formData.policy_number}
                      onChange={(e) => handleInputChange('policy_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter policy number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Year
                    </label>
                    <select
                      value={formData.plan_year}
                      onChange={(e) => handleInputChange('plan_year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select year...</option>
                      {Array.from({ length: 5 }, (_, i) => getCurrentYear() - 2 + i).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Number
                    </label>
                    <input
                      type="text"
                      value={formData.group_number}
                      onChange={(e) => handleInputChange('group_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter group number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network Type
                    </label>
                    <select
                      value={formData.network_type || ''}
                      onChange={(e) => handleInputChange('network_type', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select network type...</option>
                      <option value="HMO">HMO</option>
                      <option value="PPO">PPO</option>
                      <option value="EPO">EPO</option>
                      <option value="POS">POS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Carrier
                    </label>
                    <select
                      value={formData.carrier_id || ''}
                      onChange={(e) => handleInputChange('carrier_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select carrier...</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Dates */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Policy Dates</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => handleInputChange('effective_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.expiration_date ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.expiration_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.expiration_date}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
              </div>
              <div className="p-6">
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
                      onChange={(e) => handleInputChange('deductible_individual', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      onChange={(e) => handleInputChange('deductible_family', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      Individual Out-of-Pocket Max ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.out_of_pocket_max_individual || ''}
                      onChange={(e) => handleInputChange('out_of_pocket_max_individual', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Out-of-Pocket Max ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.out_of_pocket_max_family || ''}
                      onChange={(e) => handleInputChange('out_of_pocket_max_family', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
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
                      onChange={(e) => handleInputChange('premium_monthly', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      onChange={(e) => handleInputChange('premium_annual', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

            {/* Form Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4">
                <div className="flex justify-end space-x-4">
                  <Link
                    href="/policies"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || documents.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating Policy...' : 'Create Policy'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
