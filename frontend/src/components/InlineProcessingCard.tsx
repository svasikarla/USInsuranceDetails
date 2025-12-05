import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { documentApi } from '@/services/apiService';
import type { DocumentProcessingStatus } from '@/types/api';

interface InlineProcessingCardProps {
  documentId: string;
  fileName: string;
  onPolicyCreated?: (policyId: string) => void;
}

export default function InlineProcessingCard({
  documentId,
  fileName,
  onPolicyCreated
}: InlineProcessingCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DocumentProcessingStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [creating, setCreating] = useState(false);

  // Poll for status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const statusData = await documentApi.getDocumentProcessingStatus(documentId);
        setStatus(statusData);

        // Auto-expand when processing completes
        if (statusData.overall_status === 'completed' && !isExpanded) {
          setIsExpanded(true);

          // Show success toast
          if (statusData.policy_created) {
            toast.success('Policy created successfully!', { duration: 4000 });
          } else if (statusData.should_review) {
            toast('Ready for review - please verify the extracted data', {
              icon: '⚠️',
              duration: 5000
            });
          } else {
            toast.success('Document processed successfully!', { duration: 3000 });
          }
        }

        // Show error toast
        if (statusData.overall_status === 'failed' && status?.overall_status !== 'failed') {
          toast.error('Document processing failed', { duration: 5000 });
        }

        // Stop polling when done
        if (statusData.overall_status === 'completed' || statusData.overall_status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds
    intervalId = setInterval(fetchStatus, 2000);

    return () => clearInterval(intervalId);
  }, [documentId]);

  // Handle quick policy creation
  const handleQuickCreate = async () => {
    if (!status || creating) return;

    setCreating(true);
    try {
      if (status.policy_id) {
        // Policy already created - just navigate
        router.push(`/policies/${status.policy_id}`);
      } else {
        // Trigger policy creation
        const result = await documentApi.triggerPolicyCreation(documentId, false);
        if (result.success && result.policy_id) {
          onPolicyCreated?.(result.policy_id);
          router.push(`/policies/${result.policy_id}`);
        }
      }
    } catch (error: any) {
      console.error('Error creating policy:', error);
      alert(error.message || 'Failed to create policy');
    } finally {
      setCreating(false);
    }
  };

  // Handle edit/review - Navigate to new combined page
  const handleEdit = () => {
    router.push(`/documents/process/${documentId}`);
  };

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  const isProcessing = status.overall_status === 'processing';
  const isCompleted = status.overall_status === 'completed';
  const isFailed = status.overall_status === 'failed';
  const showQuickCreate = isCompleted && !status.should_review && !status.policy_created;
  const showReview = isCompleted && status.should_review;

  // Get confidence color
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-600';
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow transition-all duration-500 ${
        isExpanded ? 'p-6' : 'p-4'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{fileName}</h3>
          <p className="text-sm text-gray-600">
            {isProcessing && 'Processing...'}
            {isCompleted && status.policy_created && '✓ Policy Created'}
            {isCompleted && !status.policy_created && '✓ Processing Complete'}
            {isFailed && '✗ Processing Failed'}
          </p>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isCompleted
              ? 'bg-green-100 text-green-800'
              : isProcessing
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status.overall_progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            isFailed ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${status.overall_progress}%` }}
        />
      </div>

      {/* Current Stage Indicator */}
      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>{status.stages.find(s => s.status === 'in_progress')?.message || 'Processing...'}</span>
        </div>
      )}

      {/* Expanded Section - Shows when complete */}
      {isExpanded && isCompleted && (
        <div
          className="mt-4 pt-4 border-t border-gray-200 animate-fade-in"
          style={{ animation: 'fadeIn 0.3s ease-in' }}
        >
          {/* Confidence Score */}
          {status.auto_creation_confidence !== undefined && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Extraction Confidence</span>
                <span className={`text-sm font-semibold ${getConfidenceColor(status.auto_creation_confidence)}`}>
                  {Math.round(status.auto_creation_confidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    status.auto_creation_confidence >= 0.85
                      ? 'bg-green-500'
                      : status.auto_creation_confidence >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${status.auto_creation_confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Info Message */}
          {status.info_message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{status.info_message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Already Created - View Policy */}
            {status.policy_created && status.policy_id && (
              <button
                onClick={() => router.push(`/policies/${status.policy_id}`)}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                View Policy →
              </button>
            )}

            {/* High Confidence - Quick Create */}
            {showQuickCreate && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleQuickCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Policy →'
                  )}
                </button>
              </>
            )}

            {/* Medium Confidence - Review Required */}
            {showReview && (
              <>
                <button
                  onClick={() => router.push('/documents')}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Later
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Review & Create →
                </button>
              </>
            )}
          </div>

          {/* View Details Link */}
          <button
            onClick={() => router.push(`/documents/process/${documentId}`)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-900 underline w-full text-center"
          >
            View detailed status
          </button>
        </div>
      )}

      {/* Error State */}
      {isFailed && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 mb-3">
            {status.error_message || 'Processing failed. Please try uploading the document again.'}
          </p>
          <button
            onClick={() => router.push('/documents')}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Back to documents
          </button>
        </div>
      )}
    </div>
  );
}

// Add keyframe animation for fade in
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}
