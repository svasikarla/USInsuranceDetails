import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Layout, PageHeader, EmptyState } from '../../components/layout/Layout';
import { Card, Button, Badge } from '../../components/ui/DesignSystem';
import { documentApi, carrierApi } from '../../services/apiService';
import { InsuranceCarrier, PolicyDocument } from '../../types/api';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  FolderIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  document?: PolicyDocument;
}

export default function DocumentUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    try {
      setLoading(true);
      const carriersData = await carrierApi.getCarriers();
      setCarriers(carriersData);
      setError(null);
    } catch (err) {
      console.error('Error loading carriers:', err);
      setError('Failed to load carriers');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      return 'File type not supported. Please upload PDF, DOCX, or TXT files.';
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return 'File size too large. Maximum size is 50MB.';
    }
    
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploadFiles: UploadFile[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        // Collect validation errors to show to user
        errors.push(`${file.name}: ${validationError}`);
        console.error(`Invalid file ${file.name}: ${validationError}`);
        return;
      }

      const uploadFile: UploadFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending'
      };
      newUploadFiles.push(uploadFile);
    });

    // Update validation errors state
    setValidationErrors(errors);

    // Clear validation errors after 5 seconds
    if (errors.length > 0) {
      setTimeout(() => setValidationErrors([]), 5000);
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);

    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleAreaClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: Math.min(f.progress + 20, 90) } 
            : f
        ));
      }, 200);

      const document = await documentApi.uploadDocument(uploadFile.file, selectedCarrierId);
      
      clearInterval(progressInterval);
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, document } 
          : f
      ));

    } catch (err: any) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: err.message } 
          : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'uploading': case 'processing': return ClockIcon;
      case 'error': return ExclamationTriangleIcon;
      default: return DocumentTextIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'uploading': case 'processing': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Upload Documents - InsureAI Platform</title>
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
          <title>Upload Documents - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <EmptyState
            title="Error Loading Upload Page"
            description={error}
            action={{
              label: "Try Again",
              onClick: loadCarriers
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
        <title>Upload Documents - InsureAI Platform</title>
        <meta name="description" content="Upload insurance documents for AI-powered analysis and processing" />
      </Head>
      <Layout showNavigation={true}>
        <PageHeader
          title="Upload Documents"
          description="Upload insurance documents to extract text, analyze policies, and detect potential issues"
          breadcrumbs={[
            { name: 'Documents', href: '/documents' },
            { name: 'Upload' }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {/* Carrier Selection */}
              <div className="mb-6">
                <label htmlFor="carrier-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Carrier (Optional)
                </label>
                <select
                  id="carrier-select"
                  name="carrier"
                  value={selectedCarrierId}
                  onChange={(e) => setSelectedCarrierId(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  aria-label="Select insurance carrier for document upload"
                  title="Choose the insurance carrier for this document"
                >
                  <option value="">Select a carrier...</option>
                  {carriers.map(carrier => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag and Drop Area */}
              <motion.div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleAreaClick}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports PDF, DOCX, and TXT files up to 50MB
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                  ref={fileInputRef}
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e?.stopPropagation(); // Prevent event bubbling to parent div
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  aria-label="Choose files to upload"
                  title="Click to select policy documents for upload"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Choose Files
                </Button>
              </motion.div>

              {/* Validation Errors */}
              <AnimatePresence>
                {validationErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                          File Validation Errors
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Queue */}
              <AnimatePresence>
                {uploadFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Upload Queue ({uploadFiles.length})
                      </h4>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadFiles([])}
                          aria-label="Clear all selected files"
                          title="Remove all files from the upload queue"
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={uploadAllFiles}
                          disabled={uploadFiles.every(f => f.status !== 'pending')}
                          aria-label="Upload all selected files"
                          title="Start uploading all files in the queue"
                        >
                          Upload All
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {uploadFiles.map((fileItem) => {
                        const StatusIcon = getStatusIcon(fileItem.status);
                        return (
                            <motion.div
                              key={fileItem.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <StatusIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {fileItem.file.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {formatFileSize(fileItem.file.size)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                {fileItem.status === 'completed' && fileItem.document?.policy_id ? (
                                  <Link href={`/policies/${fileItem.document.policy_id}`}>
                                    <a className="text-sm font-medium text-indigo-600 hover:underline">View Policy</a>
                                  </Link>
                                ) : fileItem.status === 'uploading' ? (
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${fileItem.progress}%` }}
                                    />
                                  </div>
                                ) : (
                                  <Badge variant={getStatusColor(fileItem.status)}>
                                    {fileItem.status}
                                  </Badge>
                                )}

                                {fileItem.status === 'error' && (
                                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" title={fileItem.error} />
                                )}

                                {fileItem.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => uploadFile(fileItem)}
                                    aria-label={`Upload ${fileItem.file.name}`}
                                    title={`Upload ${fileItem.file.name}`}
                                  >
                                    Upload
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(fileItem.id)}
                                  aria-label={`Remove ${fileItem.file.name} from upload queue`}
                                  title={`Remove ${fileItem.file.name}`}
                                >
                                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Upload Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Supported File Types
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-700">PDF Documents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-gray-700">Word Documents (.docx)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Text Files (.txt)</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Processing
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Automatic text extraction using OCR</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                  <span>AI-powered red flag detection</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Policy structure analysis</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Benefit extraction and categorization</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
