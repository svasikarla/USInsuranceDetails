import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  PencilIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { policyApi, carrierApi, documentApi } from '../../services/apiService';
import { InsurancePolicy, InsuranceCarrier, CoverageBenefit, RedFlag, PolicyDocument } from '../../types/api';
import { Card, Button, Badge } from '../../components/ui/DesignSystem';
import CategorizedBenefitCard from '../../components/categorization/CategorizedBenefitCard';
import CategorizedRedFlagCard from '../../components/categorization/CategorizedRedFlagCard';
import CategorizationFilter from '../../components/categorization/CategorizationFilter';

export default function PolicyDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [carrier, setCarrier] = useState<InsuranceCarrier | null>(null);
  const [document, setDocument] = useState<PolicyDocument | null>(null);
  const [benefits, setBenefits] = useState<CoverageBenefit[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [categorizedBenefits, setCategorizedBenefits] = useState<any[]>([]);
  const [categorizedRedFlags, setCategorizedRedFlags] = useState<any[]>([]);
  const [categorizationSummary, setCategorizationSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categorizationFilters, setCategorizationFilters] = useState<any>({
    regulatory_level: [],
    prominent_category: [],
    federal_regulation: [],
    state_regulation: [],
    risk_level: []
  });

  // UI state for expandable sections
  const [expandedSections, setExpandedSections] = useState({
    benefits: true,
    redFlags: true,
    details: true,
    categorization: false
  });

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPolicyData(id);
    }
  }, [id]);

  const loadPolicyData = async (policyId: string) => {
    try {
      setLoading(true);
      
      // Load policy details
      const policyData = await policyApi.getPolicy(policyId);
      setPolicy(policyData);

      // Load related data in parallel
      const [benefitsData, redFlagsData, documentData, carriersData] = await Promise.all([
        policyApi.getPolicyBenefits(policyId).catch(() => []),
        policyApi.getRedFlags(policyId).catch(() => []),
        documentApi.getDocument(policyData.document_id).catch(() => null),
        carrierApi.getCarriers().catch(() => [])
      ]);

      setBenefits(benefitsData);
      setRedFlags(redFlagsData);
      setDocument(documentData);

      // Find the carrier
      if (policyData.carrier_id) {
        const carrierData = carriersData.find(c => c.id === policyData.carrier_id);
        setCarrier(carrierData || null);
      }

      // Load categorized data
      await loadCategorizedData(policyId);

      setError(null);
    } catch (err) {
      console.error('Error loading policy:', err);
      setError('Failed to load policy details');
    } finally {
      setLoading(false);
    }
  };

  const loadCategorizedData = async (policyId: string) => {
    try {
      // Load categorized benefits and red flags
      const [categorizedBenefitsData, categorizedRedFlagsData, summaryData] = await Promise.all([
        fetch(`/api/categorization/benefits/categorized/${policyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`/api/categorization/red-flags/categorized/${policyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.ok ? res.json() : []).catch(() => []),
        fetch(`/api/categorization/summary/${policyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.ok ? res.json() : null).catch(() => null)
      ]);

      setCategorizedBenefits(categorizedBenefitsData);
      setCategorizedRedFlags(categorizedRedFlagsData);
      setCategorizationSummary(summaryData);
    } catch (err) {
      console.error('Error loading categorized data:', err);
      // Don't set error state as this is supplementary data
    }
  };

  const handleFilterChange = (filters: any) => {
    setCategorizationFilters(filters);
  };

  const getFilteredCategorizedBenefits = () => {
    if (!categorizedBenefits.length) return [];

    return categorizedBenefits.filter(item => {
      const benefit = item.benefit;

      // Apply regulatory level filter
      if (categorizationFilters.regulatory_level.length > 0 &&
          !categorizationFilters.regulatory_level.includes(benefit.regulatory_level)) {
        return false;
      }

      // Apply prominent category filter
      if (categorizationFilters.prominent_category.length > 0 &&
          !categorizationFilters.prominent_category.includes(benefit.prominent_category)) {
        return false;
      }

      // Apply federal regulation filter
      if (categorizationFilters.federal_regulation.length > 0 &&
          !categorizationFilters.federal_regulation.includes(benefit.federal_regulation)) {
        return false;
      }

      // Apply state regulation filter
      if (categorizationFilters.state_regulation.length > 0 &&
          !categorizationFilters.state_regulation.includes(benefit.state_regulation)) {
        return false;
      }

      return true;
    });
  };

  const getFilteredCategorizedRedFlags = () => {
    if (!categorizedRedFlags.length) return [];

    return categorizedRedFlags.filter(item => {
      const redFlag = item.red_flag;

      // Apply regulatory level filter
      if (categorizationFilters.regulatory_level.length > 0 &&
          !categorizationFilters.regulatory_level.includes(redFlag.regulatory_level)) {
        return false;
      }

      // Apply prominent category filter
      if (categorizationFilters.prominent_category.length > 0 &&
          !categorizationFilters.prominent_category.includes(redFlag.prominent_category)) {
        return false;
      }

      // Apply risk level filter
      if (categorizationFilters.risk_level.length > 0 &&
          !categorizationFilters.risk_level.includes(redFlag.risk_level)) {
        return false;
      }

      return true;
    });
  };

  const handleDelete = async () => {
    if (!policy || !confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      await policyApi.deletePolicy(policy.id);
      router.push('/policies');
    } catch (err) {
      console.error('Error deleting policy:', err);
      setError('Failed to delete policy');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPolicyTypeColor = (type?: string) => {
    switch (type) {
      case 'health': return 'bg-blue-100 text-blue-800';
      case 'dental': return 'bg-green-100 text-green-800';
      case 'vision': return 'bg-purple-100 text-purple-800';
      case 'life': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBenefitCategoryColor = (category?: string) => {
    switch (category) {
      case 'preventive': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'specialist': return 'bg-purple-100 text-purple-800';
      case 'prescription': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSeverityBadgeVariant = (severity?: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusColor = (policy: InsurancePolicy) => {
    const now = new Date();
    const effectiveDate = new Date(policy.effective_date);
    const expirationDate = new Date(policy.expiration_date);

    if (now < effectiveDate) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (now > expirationDate) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  const getStatusText = (policy: InsurancePolicy) => {
    const now = new Date();
    const effectiveDate = new Date(policy.effective_date);
    const expirationDate = new Date(policy.expiration_date);

    if (now < effectiveDate) return 'Not Yet Active';
    if (now > expirationDate) return 'Expired';
    return 'Active';
  };

  const getRedFlagStats = () => {
    const stats = redFlags.reduce((acc, flag) => {
      const severity = flag.severity?.toLowerCase() || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: redFlags.length,
      critical: stats.critical || 0,
      high: stats.high || 0,
      medium: stats.medium || 0,
      low: stats.low || 0
    };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading policy details...</p>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !policy) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Policy Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested policy could not be found.'}</p>
            <Button onClick={() => router.push('/policies')}>
              Back to Policies
            </Button>
          </motion.div>
        </div>
      </ProtectedRoute>
    );
  }

  const redFlagStats = getRedFlagStats();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Enhanced Header with Breadcrumbs and Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 pt-4">
              <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              <ChevronLeftIcon className="h-4 w-4" />
              <Link href="/policies" className="hover:text-indigo-600 transition-colors">
                Policies
              </Link>
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="text-gray-900 font-medium">{policy.policy_name}</span>
            </div>

            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <Badge variant="primary" size="md">
                    {policy.policy_type || 'Unknown'}
                  </Badge>
                  <Badge
                    variant={getStatusText(policy) === 'Active' ? 'success' : getStatusText(policy) === 'Expired' ? 'danger' : 'warning'}
                    size="md"
                  >
                    {getStatusText(policy)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{policy.policy_name}</h1>
                {carrier && (
                  <p className="text-lg text-gray-600">
                    Provided by <span className="font-semibold text-indigo-600">{carrier.name}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push(`/policies/edit?id=${policy.id}`)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="md">
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="md">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  loading={deleteLoading}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Benefits</p>
                    <p className="text-2xl font-bold text-blue-900">{benefits.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600">Red Flags</p>
                    <p className="text-2xl font-bold text-red-900">{redFlagStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Effective</p>
                    <p className="text-lg font-bold text-green-900">{formatDate(policy.effective_date)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Document</p>
                    <p className="text-lg font-bold text-purple-900">
                      {document ? 'Available' : 'Missing'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Policy Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <InformationCircleIcon className="h-6 w-6 mr-2" />
                        Policy Details
                      </h2>
                      <button
                        onClick={() => toggleSection('details')}
                        className="text-white hover:text-indigo-200 transition-colors"
                      >
                        {expandedSections.details ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSections.details && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-gradient-to-br from-white to-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Policy Number
                                </label>
                                <p className="text-lg text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg">
                                  {policy.policy_number || 'Not specified'}
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Policy Type
                                </label>
                                <Badge variant="primary" size="lg" className="text-base">
                                  {policy.policy_type || 'Unknown'}
                                </Badge>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Premium Amount
                                </label>
                                <p className="text-2xl font-bold text-green-600">
                                  {formatCurrency(policy.premium_amount)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Deductible
                                </label>
                                <p className="text-lg text-gray-900">
                                  {formatCurrency(policy.deductible_amount)}
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Out-of-Pocket Maximum
                                </label>
                                <p className="text-lg text-gray-900">
                                  {formatCurrency(policy.out_of_pocket_max)}
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Coverage Level
                                </label>
                                <p className="text-lg text-gray-900 capitalize">
                                  {policy.coverage_level || 'Not specified'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {policy.summary && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Policy Summary
                              </label>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed">{policy.summary}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>

              {/* Categorization Filter Section */}
              {(categorizedBenefits.length > 0 || categorizedRedFlags.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <CategorizationFilter
                    onFilterChange={handleFilterChange}
                    showRedFlagFilters={categorizedRedFlags.length > 0}
                  />
                </motion.div>
              )}

              {/* Benefits Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <CheckCircleIcon className="h-6 w-6 mr-2" />
                        Coverage Benefits ({getFilteredCategorizedBenefits().length})
                      </h2>
                      <button
                        onClick={() => toggleSection('benefits')}
                        className="text-white hover:text-green-200 transition-colors"
                      >
                        {expandedSections.benefits ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSections.benefits && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-gradient-to-br from-white to-green-50">
                          {categorizedBenefits.length === 0 ? (
                            <div className="text-center py-8">
                              <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No benefits information available</p>
                              <p className="text-gray-400 text-sm mt-2">
                                Benefits data may be added during document processing
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {getFilteredCategorizedBenefits().map((categorizedBenefit, index) => (
                                <motion.div
                                  key={categorizedBenefit.benefit.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                  <CategorizedBenefitCard
                                    categorizedBenefit={categorizedBenefit}
                                    showDetails={true}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>

              {/* Red Flags Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-orange-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
                        Red Flags ({categorizedRedFlags.length > 0 ? getFilteredCategorizedRedFlags().length : redFlags.length})
                      </h2>
                      <div className="flex items-center space-x-4">
                        {redFlagStats.total > 0 && (
                          <div className="flex items-center space-x-2 text-white text-sm">
                            {redFlagStats.critical > 0 && (
                              <Badge variant="danger" size="sm" className="bg-red-800 text-white">
                                {redFlagStats.critical} Critical
                              </Badge>
                            )}
                            {redFlagStats.high > 0 && (
                              <Badge variant="warning" size="sm" className="bg-orange-800 text-white">
                                {redFlagStats.high} High
                              </Badge>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => toggleSection('redFlags')}
                          className="text-white hover:text-red-200 transition-colors"
                        >
                          {expandedSections.redFlags ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSections.redFlags && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-gradient-to-br from-white to-red-50">
                          {redFlags.length === 0 ? (
                            <div className="text-center py-8">
                              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                              <p className="text-green-600 text-lg font-semibold">No Red Flags Detected!</p>
                              <p className="text-gray-500 text-sm mt-2">
                                This policy appears to have no concerning limitations or exclusions
                              </p>
                            </div>
                          ) : categorizedRedFlags.length > 0 ? (
                            <div className="space-y-4">
                              {getFilteredCategorizedRedFlags().map((categorizedRedFlag, index) => (
                                <motion.div
                                  key={categorizedRedFlag.red_flag.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                  <CategorizedRedFlagCard
                                    categorizedRedFlag={categorizedRedFlag}
                                    showDetails={true}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {redFlags.map((redFlag, index) => (
                                <motion.div
                                  key={redFlag.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: index * 0.1 }}
                                  className={`border-2 rounded-xl p-5 ${getSeverityColor(redFlag.severity)}`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                        <h3 className="text-lg font-bold text-gray-900">{redFlag.title}</h3>
                                      </div>
                                      <Badge variant={getSeverityBadgeVariant(redFlag.severity)} size="md">
                                        {redFlag.severity?.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed mb-3">{redFlag.description}</p>
                                  {redFlag.flag_type && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <span className="text-sm font-medium text-gray-600">Type: </span>
                                      <span className="text-sm text-gray-900">{redFlag.flag_type}</span>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">

              {/* Important Dates Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Important Dates
                    </h3>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-white to-indigo-50 space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <label className="block text-sm font-semibold text-indigo-700 mb-1">
                        Effective Date
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDate(policy.effective_date)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <label className="block text-sm font-semibold text-indigo-700 mb-1">
                        Expiration Date
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDate(policy.expiration_date)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <label className="block text-sm font-semibold text-indigo-700 mb-1">
                        Created
                      </label>
                      <p className="text-sm text-gray-600">
                        {formatDate(policy.created_at)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <label className="block text-sm font-semibold text-indigo-700 mb-1">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-600">
                        {formatDate(policy.updated_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Carrier Information */}
              {carrier && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Insurance Carrier
                      </h3>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-white to-purple-50">
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {carrier.name}
                        </h4>
                        {carrier.website && (
                          <a
                            href={carrier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            Visit Website →
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Document Information */}
              {document && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-teal-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Source Document
                      </h3>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-white to-cyan-50 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-cyan-700 mb-1">
                          Filename
                        </label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg break-all">
                          {document.original_filename}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-cyan-700 mb-1">
                          Processing Status
                        </label>
                        <Badge
                          variant={document.processing_status === 'completed' ? 'success' : 'warning'}
                          size="md"
                        >
                          {document.processing_status}
                        </Badge>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-cyan-700 mb-1">
                          Upload Method
                        </label>
                        <p className="text-sm text-gray-900 capitalize">
                          {document.upload_method.replace('_', ' ')}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="md"
                        className="w-full"
                        onClick={() => router.push(`/documents/${document.id}`)}
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">
                      Quick Actions
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => router.push(`/policies/edit?id=${policy.id}`)}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Policy
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Share Policy
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>

                    <Button
                      variant="danger"
                      size="md"
                      className="w-full"
                      loading={deleteLoading}
                      onClick={handleDelete}
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Delete Policy
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
