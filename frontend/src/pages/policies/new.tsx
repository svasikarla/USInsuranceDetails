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

  useEffect(() => {
    if (router.query.document_id) {
      setFormData(prev => ({
        ...prev,
        document_id: router.query.document_id as string
      }));
      loadExtractedData(router.query.document_id as string);
    }
  }, [router.query]);

  const loadExtractedData = async (documentId: string) => {
    try {
      console.log('Fetching extracted data for document:', documentId);
      const extractedData = await documentApi.getExtractedPolicyData(documentId);
      console.log('Received extracted data:', extractedData);
      
      if (!extractedData) {
        console.log('No response from extraction endpoint');
        setError('Failed to retrieve policy data from the server');
        return;
      }

      if (extractedData.processing_status !== 'completed') {
        console.log('Document processing not completed:', extractedData.processing_status);
        setError(`Document processing status: ${extractedData.processing_status}`);
        return;
      }

      if (!extractedData.extracted_policy_data) {
        console.log('No extracted policy data available:', extractedData);
        let errorMessage = 'No policy data could be extracted from this document.';

        // Provide more specific error details
        const details = [];

        if (extractedData.processing_status === 'failed') {
          details.push('Document text extraction failed');
        }
        if (extractedData.processing_error) {
          details.push(`Processing error: ${extractedData.processing_error}`);
        }
        if (extractedData.auto_creation_status === 'failed') {
          details.push('Policy data extraction failed');
        }
        if (extractedData.auto_creation_confidence !== undefined && extractedData.auto_creation_confidence === 0) {
          details.push('No recognizable policy information found');
        }

        if (details.length > 0) {
          errorMessage += '\n\nDetails:\n• ' + details.join('\n• ');
        }

        errorMessage += '\n\nPlease ensure your document contains clear policy information and try uploading again, or create the policy manually.';

        setError(errorMessage);
        return;
      }

      const data = extractedData.extracted_policy_data;
      console.log('Processing extracted data:', data);

      if (extractedData.auto_creation_confidence && extractedData.auto_creation_confidence < 0.3) {
        console.log('Low confidence in extracted data:', extractedData.auto_creation_confidence);
        setError('Warning: Low confidence in extracted data. Please review carefully.');
      }
        
      setFormData(prev => {
        const newData = {
          ...prev,
          document_id: documentId,
          policy_name: data.policy_name || prev.policy_name,
          policy_type: data.policy_type || prev.policy_type,
          policy_number: data.policy_number || prev.policy_number,
          plan_year: data.plan_year || prev.plan_year,
          effective_date: data.effective_date || prev.effective_date,
          expiration_date: data.expiration_date || prev.expiration_date,
          group_number: data.group_number || prev.group_number,
          network_type: data.network_type || prev.network_type,
          deductible_individual: data.deductible_individual || prev.deductible_individual,
          deductible_family: data.deductible_family || prev.deductible_family,
          out_of_pocket_max_individual: data.out_of_pocket_max_individual || prev.out_of_pocket_max_individual,
          out_of_pocket_max_family: data.out_of_pocket_max_family || prev.out_of_pocket_max_family,
          premium_monthly: data.premium_monthly || prev.premium_monthly,
          premium_annual: data.premium_annual || prev.premium_annual,
          carrier_id: data.carrier_id || prev.carrier_id
        };
        console.log('Updated form data:', newData);
        return newData;
      });
    } catch (err) {
      console.error('Error loading extracted data:', err);
      setError('Failed to load extracted policy data. Please try again.');
    }
  };

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
        policy_name: formData.policy_name?.trim() || '',
        policy_type: formData.policy_type || undefined,
        policy_number: formData.policy_number ? formData.policy_number.trim() : undefined,
        plan_year: formData.plan_year ? formData.plan_year.trim() : undefined,
        effective_date: formData.effective_date || undefined,
        expiration_date: formData.expiration_date || undefined,
        group_number: formData.group_number ? formData.group_number.trim() : undefined,
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

          {formData.document_id && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">
                This form has been pre-filled with data extracted from the selected document. 
                Please review and update the information as needed.
              </p>
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
                    onChange={async (e) => {
                      const selectedDocId = e.target.value;
                      console.log('Document selected:', selectedDocId);
                      handleInputChange('document_id', selectedDocId);
                      setError(null);
                      
                      if (selectedDocId) {
                        try {
                          // Get document status first
                          const docStatus = await documentApi.getDocumentStatus(selectedDocId);
                          console.log('Document status:', docStatus);

                          if (docStatus.processing_status !== 'completed') {
                            setError(`Document is still being processed. Status: ${docStatus.processing_status}`);
                            return;
                          }

                          // Try to get any existing extracted data first
                          try {
                            const extractedData = await documentApi.getExtractedPolicyData(selectedDocId);
                            console.log('Initial extracted data:', extractedData);
                            
                            if (!extractedData.extracted_policy_data) {
                              console.log('No existing extracted data, triggering extraction...');
                              // If no existing data, trigger extraction
                              await documentApi.triggerPolicyCreation(selectedDocId, true);
                              console.log('Extraction triggered, waiting for results...');
                              
                              // Wait briefly then fetch the extracted data
                              setTimeout(async () => {
                                await loadExtractedData(selectedDocId);
                              }, 2000);
                            } else {
                              // Use existing extracted data
                              console.log('Using existing extracted data');
                              await loadExtractedData(selectedDocId);
                            }
                          } catch (err) {
                            console.error('Error in data extraction:', err);
                            setError('Failed to extract policy data. Please try again.');
                          }
                        } catch (err) {
                          console.error('Error checking document status:', err);
                          setError('Failed to check document status. Please try again.');
                        }
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.document_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={documents.length === 0}
                  >
                    <option value="">Select a document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {getDocumentDisplayName(doc)}
                        {doc.id === router.query.document_id ? ' (Pre-selected)' : ''}
                        {doc.processing_status !== 'completed' ? ` (${doc.processing_status})` : ''}
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
