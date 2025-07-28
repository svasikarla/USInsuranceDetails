import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Badge, Input } from '../ui/DesignSystem';
import { ExtractedPolicyData, InsurancePolicyCreate } from '../../types/api';

interface PolicyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  extractedData: ExtractedPolicyData | null;
  confidence: number;
  onApprove: (reviewedData: InsurancePolicyCreate) => void;
  onReject: () => void;
  loading?: boolean;
}

export default function PolicyReviewModal({
  isOpen,
  onClose,
  documentId,
  extractedData,
  confidence,
  onApprove,
  onReject,
  loading = false
}: PolicyReviewModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [reviewedData, setReviewedData] = useState<InsurancePolicyCreate | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (extractedData) {
      setReviewedData({
        document_id: documentId,
        policy_name: extractedData.policy_name || '',
        policy_type: extractedData.policy_type || undefined,
        policy_number: extractedData.policy_number || '',
        plan_year: extractedData.plan_year || '',
        effective_date: extractedData.effective_date || '',
        expiration_date: extractedData.expiration_date || '',
        group_number: extractedData.group_number || '',
        network_type: extractedData.network_type || undefined,
        deductible_individual: extractedData.deductible_individual || undefined,
        deductible_family: extractedData.deductible_family || undefined,
        out_of_pocket_max_individual: extractedData.out_of_pocket_max_individual || undefined,
        out_of_pocket_max_family: extractedData.out_of_pocket_max_family || undefined,
        premium_monthly: extractedData.premium_monthly || undefined,
        premium_annual: extractedData.premium_annual || undefined,
        carrier_id: undefined
      });
    }
  }, [extractedData, documentId]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const handleFieldChange = (field: keyof InsurancePolicyCreate, value: string | number | undefined) => {
    if (!reviewedData) return;
    
    setReviewedData(prev => ({
      ...prev!,
      [field]: value
    }));
    
    // Clear field error when user starts editing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!reviewedData?.policy_name?.trim()) {
      newErrors.policy_name = 'Policy name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!reviewedData || !validateForm()) return;
    onApprove(reviewedData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <PencilIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Review Extracted Policy Data</h2>
                  <p className="text-sm text-gray-600">Review and edit the automatically extracted policy information</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}>
                  {getConfidenceLabel(confidence)} ({(confidence * 100).toFixed(0)}%)
                </Badge>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Confidence Warning */}
              {confidence < 0.8 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Review Required</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        The extraction confidence is below 80%. Please carefully review all fields before creating the policy.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Mode Toggle */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    {editMode ? 'Edit mode: Click fields to modify values' : 'View mode: Click edit to modify values'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center space-x-2"
                >
                  {editMode ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
                  <span>{editMode ? 'View Mode' : 'Edit Mode'}</span>
                </Button>
              </div>

              {/* Policy Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Policy Name <span className="text-red-500">*</span>
                      </label>
                      {editMode ? (
                        <Input
                          value={reviewedData?.policy_name || ''}
                          onChange={(e) => handleFieldChange('policy_name', e.target.value)}
                          className={errors.policy_name ? 'border-red-300' : ''}
                          placeholder="Enter policy name"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {reviewedData?.policy_name || 'Not extracted'}
                        </div>
                      )}
                      {errors.policy_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.policy_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type</label>
                      {editMode ? (
                        <select
                          value={reviewedData?.policy_type || ''}
                          onChange={(e) => handleFieldChange('policy_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select type</option>
                          <option value="health">Health</option>
                          <option value="dental">Dental</option>
                          <option value="vision">Vision</option>
                          <option value="life">Life</option>
                        </select>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {reviewedData?.policy_type || 'Not extracted'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                      {editMode ? (
                        <Input
                          value={reviewedData?.policy_number || ''}
                          onChange={(e) => handleFieldChange('policy_number', e.target.value)}
                          placeholder="Enter policy number"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {reviewedData?.policy_number || 'Not extracted'}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Financial Information */}
                <Card className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Premium</label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={reviewedData?.premium_monthly || ''}
                          onChange={(e) => handleFieldChange('premium_monthly', parseFloat(e.target.value) || undefined)}
                          placeholder="Enter monthly premium"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {reviewedData?.premium_monthly ? `$${reviewedData.premium_monthly}` : 'Not extracted'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Individual Deductible</label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={reviewedData?.deductible_individual || ''}
                          onChange={(e) => handleFieldChange('deductible_individual', parseFloat(e.target.value) || undefined)}
                          placeholder="Enter individual deductible"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {reviewedData?.deductible_individual ? `$${reviewedData.deductible_individual}` : 'Not extracted'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Out-of-Pocket Max (Individual)</label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={reviewedData?.out_of_pocket_max_individual || ''}
                          onChange={(e) => handleFieldChange('out_of_pocket_max_individual', parseFloat(e.target.value) || undefined)}
                          placeholder="Enter out-of-pocket maximum"
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 rounded border text-sm">
                          {reviewedData?.out_of_pocket_max_individual ? `$${reviewedData.out_of_pocket_max_individual}` : 'Not extracted'}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <InformationCircleIcon className="h-4 w-4" />
                <span>Review the extracted data and make any necessary corrections before creating the policy.</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={onReject}
                  disabled={loading}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  disabled={loading || !reviewedData?.policy_name?.trim()}
                  className="flex items-center space-x-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{loading ? 'Creating...' : 'Create Policy'}</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
