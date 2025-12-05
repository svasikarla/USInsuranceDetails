import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '@/services/apiService';
import type { DocumentProcessingStatus, ProcessingStage } from '@/types/api';

const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_POLL_DURATION = 300000; // Stop polling after 5 minutes

export default function DocumentProcessingPage() {
  const router = useRouter();
  const { id } = router.query;
  const documentId = typeof id === 'string' ? id : '';

  const [status, setStatus] = useState<DocumentProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Fetch processing status
  const fetchStatus = async () => {
    if (!documentId) return;

    try {
      const statusData = await apiService.documentApi.getDocumentProcessingStatus(documentId);
      setStatus(statusData);
      setLoading(false);

      // Handle completion and routing
      if (statusData.overall_status === 'completed' || statusData.overall_status === 'failed') {
        // Processing is done, decide where to route
        handleCompletion(statusData);
      }
    } catch (err: any) {
      console.error('Error fetching processing status:', err);
      setError(err.message || 'Failed to fetch processing status');
      setLoading(false);
    }
  };

  // Handle completion and smart routing
  const handleCompletion = (statusData: DocumentProcessingStatus) => {
    // Don't auto-route immediately, wait for user action
    // This gives them time to read the final status
  };

  // Auto-route based on confidence after user clicks
  const handleContinue = () => {
    if (!status) return;

    if (status.policy_created && status.policy_id) {
      // Policy was created successfully - go to policy detail page
      router.push(`/policies/${status.policy_id}`);
    } else if (status.should_review) {
      // Medium confidence - go to review page
      router.push(`/documents/review/${documentId}`);
    } else if (status.overall_status === 'failed') {
      // Failed - go to manual policy creation
      router.push(`/policies/create?document_id=${documentId}`);
    } else {
      // Default - go to documents page
      router.push('/documents');
    }
  };

  // Setup polling
  useEffect(() => {
    if (!documentId) return;

    // Initial fetch
    fetchStatus();

    // Setup polling if still processing
    const interval = setInterval(() => {
      if (!status || (status.overall_status !== 'completed' && status.overall_status !== 'failed')) {
        fetchStatus();
        setPollCount(prev => prev + 1);
      }
    }, POLL_INTERVAL);

    // Cleanup
    return () => clearInterval(interval);
  }, [documentId, status?.overall_status]);

  // Stop polling after max duration
  useEffect(() => {
    if (pollCount * POLL_INTERVAL > MAX_POLL_DURATION) {
      setError('Processing is taking longer than expected. Please refresh the page.');
    }
  }, [pollCount]);

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

  // Render stage name
  const getStageName = (stageName: string) => {
    const names: Record<string, string> = {
      upload: 'Document Upload',
      extraction: 'Text Extraction',
      ai_analysis: 'AI Analysis',
      policy_creation: 'Policy Creation'
    };
    return names[stageName] || stageName;
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading processing status...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  if (!status) return null;

  const isProcessing = status.overall_status === 'processing';
  const isCompleted = status.overall_status === 'completed';
  const isFailed = status.overall_status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isProcessing && 'Processing Your Document'}
            {isCompleted && 'Processing Complete'}
            {isFailed && 'Processing Failed'}
          </h1>
          <p className="text-gray-600">
            {isProcessing && 'Please wait while we analyze your insurance policy document...'}
            {isCompleted && status.info_message}
            {isFailed && 'We encountered an issue processing your document'}
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Overall Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">{status.overall_progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  isFailed ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${status.overall_progress}%` }}
              />
            </div>
          </div>

          {/* Processing Stages */}
          <div className="space-y-6">
            {status.stages.map((stage, index) => (
              <div key={stage.name} className="flex items-start space-x-4">
                {/* Stage Icon */}
                <div className="flex-shrink-0">
                  {renderStageIcon(stage)}
                </div>

                {/* Stage Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getStageName(stage.name)}
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
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${stage.progress_percentage}%` }}
                      />
                    </div>
                  )}
                  {stage.completed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed: {new Date(stage.completed_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Confidence Scores */}
          {status.auto_creation_confidence !== undefined && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Extraction Details</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">AI Confidence</span>
                    <span className="text-xs font-medium text-gray-900">
                      {Math.round(status.auto_creation_confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status.auto_creation_confidence >= 0.8
                          ? 'bg-green-500'
                          : status.auto_creation_confidence >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${status.auto_creation_confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
        </div>

        {/* Action Buttons */}
        {(isCompleted || isFailed) && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/documents')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Documents
            </button>
            {!isFailed && (
              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {status.policy_created ? 'View Policy' : status.should_review ? 'Review Data' : 'Continue'}
              </button>
            )}
            {isFailed && (
              <button
                onClick={() => router.push(`/policies/create?document_id=${documentId}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Policy Manually
              </button>
            )}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center text-sm text-gray-500">
            <p>Checking status every 2 seconds...</p>
            <p className="mt-1">This usually takes 10-30 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
}
