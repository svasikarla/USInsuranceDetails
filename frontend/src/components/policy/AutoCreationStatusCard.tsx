import React from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CogIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button } from '../ui/DesignSystem';

interface AutoCreationStatusCardProps {
  status: string | null;
  confidence: number;
  onReview?: () => void;
  onRetry?: () => void;
  extractedData?: any;
  className?: string;
}

export default function AutoCreationStatusCard({
  status,
  confidence,
  onReview,
  onRetry,
  extractedData,
  className = ''
}: AutoCreationStatusCardProps) {
  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'not_attempted':
        return {
          icon: ClockIcon,
          label: 'Not Started',
          description: 'Automatic policy creation has not been attempted',
          color: 'text-gray-600 bg-gray-50',
          borderColor: 'border-gray-200'
        };
      case 'extracting':
        return {
          icon: CogIcon,
          label: 'Extracting Data',
          description: 'AI is analyzing the document and extracting policy information',
          color: 'text-blue-600 bg-blue-50',
          borderColor: 'border-blue-200',
          animate: true
        };
      case 'ready_for_review':
        return {
          icon: EyeIcon,
          label: 'Ready for Review',
          description: 'Policy data has been extracted and is ready for your review',
          color: 'text-yellow-600 bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'creating':
        return {
          icon: CogIcon,
          label: 'Creating Policy',
          description: 'Creating the insurance policy from reviewed data',
          color: 'text-blue-600 bg-blue-50',
          borderColor: 'border-blue-200',
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircleIcon,
          label: 'Completed',
          description: 'Policy has been successfully created automatically',
          color: 'text-green-600 bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: XCircleIcon,
          label: 'Failed',
          description: 'Automatic policy creation failed. Manual creation may be required',
          color: 'text-red-600 bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: DocumentTextIcon,
          label: 'Unknown',
          description: 'Status unknown',
          color: 'text-gray-600 bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Card className={`p-6 border-2 ${config.borderColor} ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            {config.animate ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <IconComponent className="h-6 w-6" />
              </motion.div>
            ) : (
              <IconComponent className="h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        
        {confidence > 0 && (
          <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}>
            {getConfidenceLabel(confidence)} ({(confidence * 100).toFixed(0)}%)
          </Badge>
        )}
      </div>

      {/* Progress Indicators */}
      {(status === 'extracting' || status === 'creating') && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{status === 'extracting' ? 'Analyzing document...' : 'Creating policy...'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      {/* Extracted Data Summary */}
      {extractedData && status === 'ready_for_review' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Information</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {extractedData.policy_name && (
              <div>
                <span className="text-gray-500">Policy:</span>
                <span className="ml-1 text-gray-900">{extractedData.policy_name}</span>
              </div>
            )}
            {extractedData.policy_type && (
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-1 text-gray-900 capitalize">{extractedData.policy_type}</span>
              </div>
            )}
            {extractedData.premium_monthly && (
              <div>
                <span className="text-gray-500">Premium:</span>
                <span className="ml-1 text-gray-900">${extractedData.premium_monthly}/mo</span>
              </div>
            )}
            {extractedData.deductible_individual && (
              <div>
                <span className="text-gray-500">Deductible:</span>
                <span className="ml-1 text-gray-900">${extractedData.deductible_individual}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {status === 'ready_for_review' && onReview && (
          <Button
            variant="primary"
            size="sm"
            onClick={onReview}
            className="flex items-center space-x-2"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Review & Create Policy</span>
          </Button>
        )}
        
        {status === 'failed' && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center space-x-2"
          >
            <CogIcon className="h-4 w-4" />
            <span>Retry Extraction</span>
          </Button>
        )}
        
        {status === 'completed' && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Policy created successfully</span>
          </div>
        )}
      </div>

      {/* Confidence Warning */}
      {confidence > 0 && confidence < 0.6 && status !== 'failed' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Low Confidence Warning</p>
              <p className="text-yellow-700">
                The extraction confidence is below 60%. Please carefully review all extracted data before creating the policy.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
