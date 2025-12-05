import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/services/apiService';
import type { DocumentProcessingStatus, ProcessingStage, ExtractedPolicyData } from '@/types/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_POLL_DURATION = 300000; // Stop polling after 5 minutes

interface FieldConfidence {
  value: any;
  confidence: number;
  source: 'extracted' | 'inferred' | 'missing';
}

export default function CombinedProcessingPage() {
  const router = useRouter();
  const { id } = router.query;
  const documentId = typeof id === 'string' ? id : '';

  // Processing state
  const [status, setStatus] = useState<DocumentProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [fieldConfidences, setFieldConfidences] = useState<Record<string, FieldConfidence>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch processing status
  const fetchStatus = useCallback(async () => {
    if (!documentId) return;

    try {
      const statusData = await apiService.documentApi.getDocumentProcessingStatus(documentId);
      setStatus(statusData);
      setLoading(false);

      // When processing completes, fetch extracted data if review is needed
      if (statusData.overall_status === 'completed' && statusData.should_review && !showReview) {
        await fetchExtractedData();
        setShowReview(true);
      }

      // Auto-redirect if policy was created
      if (statusData.overall_status === 'completed' && statusData.policy_created && statusData.policy_id) {
        toast.success('Policy created successfully!');
        setTimeout(() => {
          router.push(`/policies/${statusData.policy_id}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error fetching processing status:', err);
      setError(err.message || 'Failed to fetch processing status');
      setLoading(false);
    }
  }, [documentId, showReview, router]);

  // Fetch extracted policy data for review
  const fetchExtractedData = async () => {
    try {
      const response = await apiService.documentApi.getExtractedPolicyData(documentId);
      setExtractedData(response);

      if (response.extracted_policy_data) {
        setFormData(response.extracted_policy_data);

        // Calculate field-level confidences (simulated for now)
        const confidences: Record<string, FieldConfidence> = {};
        Object.keys(response.extracted_policy_data).forEach(key => {
          const value = response.extracted_policy_data[key];
          if (value) {
            // Simulate confidence based on value completeness
            const confidence = calculateFieldConfidence(key, value);
            confidences[key] = {
              value,
              confidence,
              source: confidence > 0.7 ? 'extracted' : 'inferred'
            };
          } else {
            confidences[key] = {
              value: null,
              confidence: 0,
              source: 'missing'
            };
          }
        });
        setFieldConfidences(confidences);
      }
    } catch (err: any) {
      console.error('Error fetching extracted data:', err);
      toast.error('Failed to load extracted data');
    }
  };

  // Calculate field confidence (simulated)
  const calculateFieldConfidence = (field: string, value: any): number => {
    if (!value) return 0;

    // Critical fields need higher confidence
    const criticalFields = ['policy_name', 'policy_type', 'policy_number'];
    const baseConfidence = criticalFields.includes(field) ? 0.9 : 0.8;

    // Adjust based on value completeness
    if (typeof value === 'string' && value.length < 3) return 0.5;
    if (typeof value === 'number' && value <= 0) return 0.6;

    return baseConfidence;
  };

  // Setup polling
  useEffect(() => {
    if (!documentId) return;

    fetchStatus();

    const interval = setInterval(() => {
      if (!status || (status.overall_status !== 'completed' && status.overall_status !== 'failed')) {
        fetchStatus();
        setPollCount(prev => prev + 1);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [documentId, status?.overall_status, fetchStatus]);

  // Stop polling after max duration
  useEffect(() => {
    if (pollCount * POLL_INTERVAL > MAX_POLL_DURATION) {
      setError('Processing is taking longer than expected. Please refresh the page.');
    }
  }, [pollCount]);

  // Handle form field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Update confidence when user modifies
    setFieldConfidences(prev => ({
      ...prev,
      [field]: {
        value,
        confidence: 1.0, // User input = 100% confidence
        source: 'extracted'
      }
    }));
  };

  // Submit reviewed data
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiService.documentApi.createPolicyFromReview(documentId, formData);

      if (result.success && result.policy_id) {
        toast.success('Policy created successfully!');
        router.push(`/policies/${result.policy_id}`);
      }
    } catch (err: any) {
      console.error('Error creating policy:', err);
      setError(err.message || 'Failed to create policy');
      toast.error('Failed to create policy');
      setSubmitting(false);
    }
  };

  // Quick create (skip review)
  const handleQuickCreate = async () => {
    if (!status || submitting) return;

    setSubmitting(true);
    try {
      const result = await apiService.documentApi.triggerPolicyCreation(documentId, false);
      if (result.success && result.policy_id) {
        toast.success('Policy created successfully!');
        router.push(`/policies/${result.policy_id}`);
      }
    } catch (error: any) {
      console.error('Error creating policy:', error);
      setError(error.message || 'Failed to create policy');
      toast.error('Failed to create policy');
      setSubmitting(false);
    }
  };

  // Render stage icon
  const renderStageIcon = (stage: ProcessingStage) => {
    if (stage.status === 'completed') {
      return (
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (stage.status === 'in_progress') {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      );
    } else if (stage.status === 'failed') {
      return (
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-500 rounded-full" />
        </div>
      );
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Get confidence badge
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) return { color: 'bg-green-100 text-green-800', icon: '✓' };
    if (confidence >= 0.6) return { color: 'bg-yellow-100 text-yellow-800', icon: '⚠' };
    if (confidence > 0) return { color: 'bg-orange-100 text-orange-800', icon: '!' };
    return { color: 'bg-red-100 text-red-800', icon: '✗' };
  };

  // Render field with confidence
  const renderFieldWithConfidence = (
    label: string,
    field: string,
    type: 'text' | 'number' | 'date' | 'select',
    options?: { value: string; label: string }[],
    required = false
  ) => {
    const fieldConf = fieldConfidences[field] || { confidence: 0, source: 'missing' };
    const badge = getConfidenceBadge(fieldConf.confidence);

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {fieldConf.source !== 'missing' && (
            <span className={`text-xs px-2 py-1 rounded-full ${badge.color} flex items-center space-x-1`}>
              <span>{badge.icon}</span>
              <span>{Math.round(fieldConf.confidence * 100)}%</span>
            </span>
          )}
        </div>

        {type === 'select' && options ? (
          <select
            value={formData[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldConf.confidence < 0.6 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
            }`}
            required={required}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={formData[field] || ''}
            onChange={(e) => handleFieldChange(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              fieldConf.confidence < 0.6 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
            }`}
            required={required}
            step={type === 'number' ? '0.01' : undefined}
            min={type === 'number' ? '0' : undefined}
          />
        )}

        {fieldConf.confidence < 0.6 && fieldConf.confidence > 0 && (
          <p className="mt-1 text-xs text-yellow-700">Please verify this value</p>
        )}
        {fieldConf.source === 'missing' && (
          <p className="mt-1 text-xs text-red-600">This field was not found in the document</p>
        )}
      </div>
    );
  };

  if (loading && !status) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Processing Document - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error && !status) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Error - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <div className="min-h-screen flex items-center justify-center">
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
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!status) return null;

  const isProcessing = status.overall_status === 'processing';
  const isCompleted = status.overall_status === 'completed';
  const isFailed = status.overall_status === 'failed';

  return (
    <ProtectedRoute>
      <Head>
        <title>
          {isProcessing && 'Processing Document'}
          {isCompleted && 'Review Policy Data'}
          {isFailed && 'Processing Failed'}
          {' - InsureAI Platform'}
        </title>
      </Head>
      <Layout showNavigation={true}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isProcessing && 'Processing Your Document'}
              {isCompleted && !showReview && 'Processing Complete'}
              {isCompleted && showReview && 'Review Policy Data'}
              {isFailed && 'Processing Failed'}
            </h1>
            <p className="text-gray-600">
              {isProcessing && 'Please wait while we analyze your insurance policy document...'}
              {isCompleted && showReview && 'Please review and correct any information before creating the policy'}
              {isCompleted && !showReview && status.info_message}
              {isFailed && 'We encountered an issue processing your document'}
            </p>
          </motion.div>

          {/* Processing Progress Card */}
          <AnimatePresence mode="wait">
            {(isProcessing || !showReview) && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-lg p-8 mb-6"
              >
                {/* Overall Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-medium text-gray-700">{status.overall_progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${status.overall_progress}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-3 rounded-full ${
                        isFailed ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Processing Stages */}
                <div className="space-y-6">
                  {status.stages.map((stage) => (
                    <div key={stage.name} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">{renderStageIcon(stage)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">
                            {stage.name.replace(/_/g, ' ')}
                          </h3>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              stage.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : stage.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : stage.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {stage.status === 'in_progress' ? 'In Progress' : stage.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{stage.message}</p>
                        {stage.status === 'in_progress' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              animate={{ width: `${stage.progress_percentage}%` }}
                              transition={{ duration: 0.3 }}
                              className="h-2 bg-blue-500 rounded-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error Message */}
                {status.error_message && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-800">{status.error_message}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons for Completed/Failed */}
                {(isCompleted && !showReview) && (
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/documents')}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back to Documents
                    </button>
                    {status.policy_created && status.policy_id && (
                      <button
                        onClick={() => router.push(`/policies/${status.policy_id}`)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        View Policy
                      </button>
                    )}
                  </div>
                )}

                {isFailed && (
                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/documents')}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back to Documents
                    </button>
                    <button
                      onClick={() => router.push(`/policies/create?document_id=${documentId}`)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Create Manually
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Review Form - Appears inline when ready */}
            {showReview && isCompleted && (
              <motion.form
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSubmitReview}
                className="bg-white rounded-lg shadow-lg p-8"
              >
                {/* Confidence Summary */}
                {extractedData?.auto_creation_confidence !== undefined && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Extraction Confidence</span>
                      <span className={`text-sm font-semibold ${getConfidenceColor(extractedData.auto_creation_confidence)}`}>
                        {Math.round(extractedData.auto_creation_confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          extractedData.auto_creation_confidence >= 0.85
                            ? 'bg-green-500'
                            : extractedData.auto_creation_confidence >= 0.6
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${extractedData.auto_creation_confidence * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-800 mt-2">
                      Fields highlighted in yellow need your attention
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Policy Name */}
                  {renderFieldWithConfidence('Policy Name', 'policy_name', 'text', undefined, true)}

                  {/* Policy Type */}
                  {renderFieldWithConfidence('Policy Type', 'policy_type', 'select', [
                    { value: '', label: 'Select Type' },
                    { value: 'health', label: 'Health' },
                    { value: 'dental', label: 'Dental' },
                    { value: 'vision', label: 'Vision' },
                    { value: 'life', label: 'Life' }
                  ], true)}

                  {/* Policy Number */}
                  {renderFieldWithConfidence('Policy Number', 'policy_number', 'text')}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithConfidence('Effective Date', 'effective_date', 'date')}
                    {renderFieldWithConfidence('Expiration Date', 'expiration_date', 'date')}
                  </div>

                  {/* Deductibles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithConfidence('Individual Deductible ($)', 'deductible_individual', 'number')}
                    {renderFieldWithConfidence('Family Deductible ($)', 'deductible_family', 'number')}
                  </div>

                  {/* Out of Pocket Max */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithConfidence('Individual Out-of-Pocket Max ($)', 'out_of_pocket_max_individual', 'number')}
                    {renderFieldWithConfidence('Family Out-of-Pocket Max ($)', 'out_of_pocket_max_family', 'number')}
                  </div>

                  {/* Premiums */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFieldWithConfidence('Monthly Premium ($)', 'premium_monthly', 'number')}
                    {renderFieldWithConfidence('Annual Premium ($)', 'premium_annual', 'number')}
                  </div>

                  {/* Network Type */}
                  {renderFieldWithConfidence('Network Type', 'network_type', 'select', [
                    { value: '', label: 'Select Network Type' },
                    { value: 'HMO', label: 'HMO' },
                    { value: 'PPO', label: 'PPO' },
                    { value: 'EPO', label: 'EPO' },
                    { value: 'POS', label: 'POS' }
                  ])}

                  {/* Group Number */}
                  {renderFieldWithConfidence('Group Number', 'group_number', 'text')}

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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Policy...
                      </>
                    ) : (
                      'Create Policy'
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-500 mt-4"
            >
              <p>Checking status every 2 seconds...</p>
              <p className="mt-1">This usually takes 10-30 seconds</p>
            </motion.div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
