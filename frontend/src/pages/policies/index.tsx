import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Layout, PageHeader, EmptyState } from '../../components/layout/Layout';
import { Card, Button, Badge, Input } from '../../components/ui/DesignSystem';
import { policyApi, carrierApi } from '../../services/apiService';
import { InsurancePolicy, InsuranceCarrier, PolicyFilters } from '../../types/api';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function PoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [filters, setFilters] = useState<PolicyFilters>({
    policy_type: '',
    carrier_id: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'created_at' | 'policy_name' | 'premium_monthly'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [filters, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policiesData, carriersData] = await Promise.all([
        policyApi.getPolicies(),
        carrierApi.getCarriers()
      ]);
      setPolicies(policiesData);
      setCarriers(carriersData);
      setError(null);
    } catch (err) {
      console.error('Error loading policies:', err);
      setError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const policiesData = await policyApi.getPolicies(filters, sortBy, sortOrder);
      setPolicies(policiesData);
    } catch (err) {
      console.error('Error loading policies:', err);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPolicyTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'health': return 'primary';
      case 'dental': return 'success';
      case 'vision': return 'info';
      case 'life': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusColor = (policy: InsurancePolicy) => {
    const now = new Date();
    const expiration = new Date(policy.expiration_date);
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiration < 0) return 'danger';
    if (daysUntilExpiration < 30) return 'warning';
    return 'success';
  };

  const getStatusText = (policy: InsurancePolicy) => {
    const now = new Date();
    const expiration = new Date(policy.expiration_date);
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiration < 0) return 'Expired';
    if (daysUntilExpiration < 30) return `Expires in ${daysUntilExpiration} days`;
    return 'Active';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Policies - InsureAI Platform</title>
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
          <title>Policies - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <EmptyState
            title="Error Loading Policies"
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
        <title>Policies - InsureAI Platform</title>
        <meta name="description" content="Manage your insurance policies with AI-powered analysis" />
      </Head>
      <Layout showNavigation={true}>
        <PageHeader
          title="Insurance Policies"
          description="Manage and analyze your insurance policies with AI-powered insights"
          actions={
            <div className="flex items-center space-x-3">
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
                onClick={() => router.push('/policies/new')}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Policy</span>
              </Button>
            </div>
          }
        />

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search policies..."
                value={filters.search}
                onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
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
                    Policy Type
                  </label>
                  <select
                    value={filters.policy_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, policy_type: e.target.value }))}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="health">Health</option>
                    <option value="dental">Dental</option>
                    <option value="vision">Vision</option>
                    <option value="life">Life</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carrier
                  </label>
                  <select
                    value={filters.carrier_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, carrier_id: e.target.value }))}
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
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="policy_name-asc">Name A-Z</option>
                    <option value="policy_name-desc">Name Z-A</option>
                    <option value="premium_monthly-desc">Highest Premium</option>
                    <option value="premium_monthly-asc">Lowest Premium</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Policies Grid */}
        {policies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy, index) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card hover className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getPolicyTypeColor(policy.policy_type)}>
                          {policy.policy_type}
                        </Badge>
                        <Badge variant={getStatusColor(policy)}>
                          {getStatusText(policy)}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {policy.policy_name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                        {policy.carrier?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Annual Premium</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(policy.premium_annual)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Deductible</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(policy.deductible_individual)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expires</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(policy.expiration_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/policies/${policy.id}`)}
                        aria-label={`View details for ${policy.policy_name}`}
                        title={`View details for ${policy.policy_name}`}
                      >
                        <EyeIcon className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/policies/edit?id=${policy.id}`)}
                        aria-label={`Edit ${policy.policy_name}`}
                        title={`Edit ${policy.policy_name}`}
                      >
                        <PencilIcon className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    {policy.red_flags && policy.red_flags.length > 0 && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {policy.red_flags.length} Red Flag{policy.red_flags.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Policies Found"
            description="Start by adding your first insurance policy to get AI-powered insights and analysis."
            action={{
              label: "Add Your First Policy",
              onClick: () => router.push('/policies/new')
            }}
            icon={DocumentTextIcon}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}
