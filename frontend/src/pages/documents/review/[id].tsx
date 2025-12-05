import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '@/services/apiService';
import type { ExtractedPolicyData } from '@/types/api';

export default function DocumentReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const documentId = typeof id === 'string' ? id : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch extracted policy data
  useEffect(() => {
    if (!documentId) return;

    const fetchData = async () => {
      try {
        const response = await apiService.documentApi.getExtractedPolicyData(documentId);
        setExtractedData(response);

        // Initialize form with extracted data
        if (response.extracted_policy_data) {
          setFormData(response.extracted_policy_data);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching extracted data:', err);
        setError(err.message || 'Failed to load extracted data');
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId]);

  // Handle form field change
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit reviewed data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiService.documentApi.createPolicyFromReview(documentId, formData);

      // Success - redirect to policy detail page
      if (result.success && result.policy_id) {
        router.push(`/policies/${result.policy_id}`);
      }
    } catch (err: any) {
      console.error('Error creating policy:', err);
      setError(err.message || 'Failed to create policy');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading extracted data...</p>
        </div>
      </div>
    );
  }

  if (error && !extractedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/documents')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  const confidenceColor = extractedData?.auto_creation_confidence >= 0.7
    ? 'text-green-600'
    : extractedData?.auto_creation_confidence >= 0.5
    ? 'text-yellow-600'
    : 'text-orange-600';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Extracted Policy Data</h1>
          <p className="text-gray-600">
            We've extracted policy information from your document. Please review and correct any information before creating the policy.
          </p>
          {extractedData?.auto_creation_confidence !== undefined && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Extraction Confidence:</span>
              <span className={`text-sm font-semibold ${confidenceColor}`}>
                {Math.round(extractedData.auto_creation_confidence * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Policy Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Name *
              </label>
              <input
                type="text"
                value={formData.policy_name || ''}
                onChange={(e) => handleChange('policy_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Policy Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Type *
              </label>
              <select
                value={formData.policy_type || 'health'}
                onChange={(e) => handleChange('policy_type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="health">Health</option>
                <option value="dental">Dental</option>
                <option value="vision">Vision</option>
                <option value="life">Life</option>
              </select>
            </div>

            {/* Policy Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Number
              </label>
              <input
                type="text"
                value={formData.policy_number || ''}
                onChange={(e) => handleChange('policy_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={formData.effective_date || ''}
                  onChange={(e) => handleChange('effective_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiration_date || ''}
                  onChange={(e) => handleChange('expiration_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Deductibles Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Individual Deductible ($)
                </label>
                <input
                  type="number"
                  value={formData.deductible_individual || ''}
                  onChange={(e) => handleChange('deductible_individual', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Deductible ($)
                </label>
                <input
                  type="number"
                  value={formData.deductible_family || ''}
                  onChange={(e) => handleChange('deductible_family', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Out of Pocket Max Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Individual Out-of-Pocket Max ($)
                </label>
                <input
                  type="number"
                  value={formData.out_of_pocket_max_individual || ''}
                  onChange={(e) => handleChange('out_of_pocket_max_individual', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Out-of-Pocket Max ($)
                </label>
                <input
                  type="number"
                  value={formData.out_of_pocket_max_family || ''}
                  onChange={(e) => handleChange('out_of_pocket_max_family', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Premium Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Premium ($)
                </label>
                <input
                  type="number"
                  value={formData.premium_monthly || ''}
                  onChange={(e) => handleChange('premium_monthly', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Premium ($)
                </label>
                <input
                  type="number"
                  value={formData.premium_annual || ''}
                  onChange={(e) => handleChange('premium_annual', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Network Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Network Type
              </label>
              <select
                value={formData.network_type || ''}
                onChange={(e) => handleChange('network_type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Network Type</option>
                <option value="HMO">HMO</option>
                <option value="PPO">PPO</option>
                <option value="EPO">EPO</option>
                <option value="POS">POS</option>
              </select>
            </div>

            {/* Group Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Number
              </label>
              <input
                type="text"
                value={formData.group_number || ''}
                onChange={(e) => handleChange('group_number', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/documents')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Policy...
                </span>
              ) : (
                'Create Policy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
