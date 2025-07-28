import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Layout, PageHeader, EmptyState } from '../../components/layout/Layout';
import { Card, Button, Badge, Input } from '../../components/ui/DesignSystem';
import { documentApi, carrierApi } from '../../services/apiService';
import { PolicyDocument, InsuranceCarrier, DocumentFilters } from '../../types/api';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const newFilters: DocumentFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (statusFilter) newFilters.processing_status = statusFilter;
    if (carrierFilter) newFilters.carrier_id = carrierFilter;
    
    setFilters(newFilters);
    loadDocuments(newFilters);
  }, [searchTerm, statusFilter, carrierFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [documentsData, carriersData] = await Promise.all([
        documentApi.getDocuments(),
        carrierApi.getCarriers()
      ]);
      setDocuments(documentsData);
      setCarriers(carriersData);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (filters: DocumentFilters) => {
    try {
      const documentsData = await documentApi.getDocuments(filters);
      setDocuments(documentsData);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'danger';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return CheckCircleIcon;
      case 'processing': return ClockIcon;
      case 'failed': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      await Promise.all(
        selectedDocuments.map(id => documentApi.deleteDocument(id))
      );
      setSelectedDocuments([]);
      loadData();
    } catch (err) {
      console.error('Error deleting documents:', err);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Documents - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <div className="flex items-center justify-center min-h-96">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"
            />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Documents - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <EmptyState
            title="Error Loading Documents"
            description={error}
            action={{
              label: "Try Again",
              onClick: loadData
            }}
            icon={ExclamationTriangleIcon}
          />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>Documents - InsureAI Platform</title>
        <meta name="description" content="Manage and process your insurance documents with AI-powered analysis" />
      </Head>
      <Layout showNavigation={true}>
        <PageHeader
          title="Document Management"
          description="Upload, process, and analyze insurance documents with AI-powered text extraction"
          actions={
            <div className="flex items-center space-x-3">
              {selectedDocuments.length > 0 && (
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete ({selectedDocuments.length})</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/documents/upload')}
                className="flex items-center space-x-2"
              >
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>Upload Document</span>
              </Button>
            </div>
          }
        />

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={setSearchTerm}
                icon={MagnifyingGlassIcon}
              />
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carrier
                  </label>
                  <select
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Carriers</option>
                    {carriers.map(carrier => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as any);
                      setSortOrder(order as any);
                    }}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="size-desc">Largest First</option>
                    <option value="size-asc">Smallest First</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Documents Grid */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document, index) => {
              const StatusIcon = getStatusIcon(document.processing_status);
              return (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card hover className="p-6 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(document.id)}
                          onChange={() => handleDocumentSelect(document.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={getStatusColor(document.processing_status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {document.processing_status}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                            {document.original_filename}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {document.carrier?.name || 'No carrier assigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">File Size</span>
                        <span className="font-medium text-gray-900">
                          {formatFileSize(document.file_size_bytes)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Uploaded</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(document.created_at)}
                        </span>
                      </div>
                      {document.processed_at && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Processed</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(document.processed_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/documents/${document.id}`)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Download logic */}}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      {document.ocr_confidence_score && (
                        <div className="text-sm text-gray-600">
                          OCR: {Math.round(document.ocr_confidence_score * 100)}%
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Documents Found"
            description="Start by uploading your first insurance document to get AI-powered analysis and insights."
            action={{
              label: "Upload Your First Document",
              onClick: () => router.push('/documents/upload')
            }}
            icon={DocumentArrowUpIcon}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}
