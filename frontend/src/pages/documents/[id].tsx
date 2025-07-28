import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { documentApi, policyApi, carrierApi } from '../../services/apiService';
import { PolicyDocumentWithText, InsurancePolicy, InsuranceCarrier, ExtractedPolicyData, InsurancePolicyCreate } from '../../types/api';
import PolicyReviewModal from '../../components/policy/PolicyReviewModal';
import AutoCreationStatusCard from '../../components/policy/AutoCreationStatusCard';

export default function DocumentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [document, setDocument] = useState<PolicyDocumentWithText | null>(null);
  const [relatedPolicies, setRelatedPolicies] = useState<InsurancePolicy[]>([]);
  const [carrier, setCarrier] = useState<InsuranceCarrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Enhanced auto-creation state
  const [autoCreationData, setAutoCreationData] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [creatingPolicy, setCreatingPolicy] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadDocumentData(id);
    }
  }, [id]);

  const loadDocumentData = async (documentId: string) => {
    try {
      setLoading(true);
      
      // Load document details
      const documentData = await documentApi.getDocument(documentId);
      setDocument(documentData);

      // Load related data
      const [policiesData, carriersData] = await Promise.all([
        policyApi.getPolicies(),
        carrierApi.getCarriers()
      ]);

      // Filter policies related to this document
      const relatedPolicies = policiesData.filter(policy => policy.document_id === documentId);
      setRelatedPolicies(relatedPolicies);

      // Find carrier if document has one
      if (documentData.carrier_id) {
        const carrierData = carriersData.find(c => c.id === documentData.carrier_id);
        setCarrier(carrierData || null);
      }

      // Load auto-creation data if document is processed
      if (documentData.processing_status === 'completed') {
        try {
          const autoCreationData = await documentApi.getExtractedPolicyData(documentId);
          setAutoCreationData(autoCreationData);
        } catch (autoErr) {
          console.log('No auto-creation data available:', autoErr);
          // This is expected for documents without auto-creation data
        }
      }

      setError(null);
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.response?.status === 404 ? 'Document not found' : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!document) return;

    try {
      setIsReprocessing(true);
      // Note: This would require a reprocess endpoint in the backend
      // For now, we'll simulate by reloading the document
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadDocumentData(document.id);
    } catch (err) {
      console.error('Error reprocessing document:', err);
      setError('Failed to reprocess document');
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await documentApi.deleteDocument(document.id);
      router.push('/documents');
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  // Enhanced auto-creation handlers
  const handleReviewExtractedData = () => {
    setShowReviewModal(true);
  };

  const handleApprovePolicy = async (reviewedData: InsurancePolicyCreate) => {
    if (!document) return;

    try {
      setCreatingPolicy(true);
      const result = await documentApi.createPolicyFromReview(document.id, reviewedData);

      if (result.success) {
        setShowReviewModal(false);
        // Refresh document data to update status
        await loadDocumentData(document.id);
        // Redirect to the new policy
        router.push(`/policies/${result.policy_id}`);
      }
    } catch (err: any) {
      console.error('Error creating policy from review:', err);
      setError(err.response?.data?.detail || 'Failed to create policy');
    } finally {
      setCreatingPolicy(false);
    }
  };

  const handleRejectPolicy = () => {
    setShowReviewModal(false);
    // Could implement additional logic here like marking as rejected
  };

  const handleRetryExtraction = async () => {
    if (!document) return;

    try {
      await documentApi.triggerPolicyCreation(document.id, true);
      // Refresh document data
      await loadDocumentData(document.id);
    } catch (err: any) {
      console.error('Error retrying extraction:', err);
      setError(err.response?.data?.detail || 'Failed to retry extraction');
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: '⏳',
      processing: '⚙️',
      completed: '✅',
      failed: '❌'
    };
    
    return icons[status as keyof typeof icons] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 500) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !document) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/documents"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Documents
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
                  <Link href="/documents" className="hover:text-gray-700">Documents</Link>
                  <span>/</span>
                  <span>{document?.original_filename}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Document Details</h1>
                <p className="text-sm text-gray-600 mt-1">
                  View document information, processing status, and extracted content
                </p>
              </div>
              <div className="flex space-x-3">
                {document?.processing_status === 'completed' && (
                  <Link
                    href={`/policies/new?document_id=${document.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Create Policy
                  </Link>
                )}
                <Link
                  href="/documents"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Back to Documents
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Document Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Document Information</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(document?.processing_status || '')}`}>
                      <span className="mr-1">{getStatusIcon(document?.processing_status || '')}</span>
                      {document?.processing_status}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Filename</h4>
                      <p className="text-sm text-gray-900">{document?.original_filename}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">File Type</h4>
                      <p className="text-sm text-gray-900">{document?.mime_type}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">File Size</h4>
                      <p className="text-sm text-gray-900">{document ? formatFileSize(document.file_size_bytes) : 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Upload Method</h4>
                      <p className="text-sm text-gray-900">{document?.upload_method.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Uploaded</h4>
                      <p className="text-sm text-gray-900">{document ? formatDate(document.created_at) : 'N/A'}</p>
                    </div>
                    {document?.processed_at && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Processed</h4>
                        <p className="text-sm text-gray-900">{formatDate(document.processed_at)}</p>
                      </div>
                    )}
                    {document?.ocr_confidence_score && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">OCR Confidence</h4>
                        <p className="text-sm text-gray-900">{(document.ocr_confidence_score * 100).toFixed(1)}%</p>
                      </div>
                    )}
                    {carrier && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Insurance Carrier</h4>
                        <p className="text-sm text-gray-900">{carrier.name}</p>
                      </div>
                    )}
                  </div>

                  {document?.processing_error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Processing Error</h4>
                      <p className="text-sm text-red-700">{document.processing_error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Text */}
              {document?.extracted_text && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Extracted Text</h3>
                      <button
                        onClick={() => setShowFullText(!showFullText)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showFullText ? 'Show Less' : 'Show Full Text'}
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {showFullText 
                          ? document.extracted_text 
                          : truncateText(document.extracted_text)
                        }
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Policies */}
              {relatedPolicies.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Related Policies ({relatedPolicies.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {relatedPolicies.map((policy) => (
                      <div key={policy.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {policy.policy_name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              {policy.policy_type && (
                                <span className="capitalize">{policy.policy_type}</span>
                              )}
                              {policy.policy_number && (
                                <span>#{policy.policy_number}</span>
                              )}
                              <span>{formatDate(policy.created_at)}</span>
                            </div>
                          </div>
                          <Link
                            href={`/policies/${policy.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Policy
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Actions</h3>
                </div>
                <div className="p-6 space-y-3">
                  {document?.processing_status === 'completed' && (
                    <Link
                      href={`/policies/new?document_id=${document.id}`}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Create Policy
                    </Link>
                  )}
                  
                  {(document?.processing_status === 'failed' || document?.processing_status === 'completed') && (
                    <button
                      onClick={handleReprocess}
                      disabled={isReprocessing}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isReprocessing ? 'Reprocessing...' : 'Reprocess Document'}
                    </button>
                  )}
                  
                  <button
                    onClick={handleDelete}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete Document
                  </button>
                </div>
              </div>

              {/* Auto-Creation Status */}
              {autoCreationData && (
                <AutoCreationStatusCard
                  status={autoCreationData.auto_creation_status}
                  confidence={autoCreationData.auto_creation_confidence}
                  extractedData={autoCreationData.extracted_policy_data}
                  onReview={handleReviewExtractedData}
                  onRetry={handleRetryExtraction}
                />
              )}

              {/* Processing Status */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Upload Complete</p>
                        <p className="text-sm text-gray-500">File uploaded successfully</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          document?.processing_status === 'pending' 
                            ? 'bg-yellow-100' 
                            : 'bg-green-100'
                        }`}>
                          <span className={`text-sm ${
                            document?.processing_status === 'pending' 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                          }`}>
                            {document?.processing_status === 'pending' ? '⏳' : '✓'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Text Extraction</p>
                        <p className="text-sm text-gray-500">
                          {document?.processing_status === 'pending' 
                            ? 'Waiting to process...' 
                            : 'Text extracted from document'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          document?.processing_status === 'completed' 
                            ? 'bg-green-100' 
                            : document?.processing_status === 'failed'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                        }`}>
                          <span className={`text-sm ${
                            document?.processing_status === 'completed' 
                              ? 'text-green-600' 
                              : document?.processing_status === 'failed'
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}>
                            {document?.processing_status === 'completed' 
                              ? '✓' 
                              : document?.processing_status === 'failed'
                              ? '✗'
                              : '○'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Analysis Complete</p>
                        <p className="text-sm text-gray-500">
                          {document?.processing_status === 'completed' 
                            ? 'Ready for policy creation' 
                            : document?.processing_status === 'failed'
                            ? 'Processing failed'
                            : 'Analysis pending'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Review Modal */}
      <PolicyReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        documentId={document?.id || ''}
        extractedData={autoCreationData?.extracted_policy_data}
        confidence={autoCreationData?.auto_creation_confidence || 0}
        onApprove={handleApprovePolicy}
        onReject={handleRejectPolicy}
        loading={creatingPolicy}
      />
    </ProtectedRoute>
  );
}
