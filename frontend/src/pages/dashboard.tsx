import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Layout, PageHeader, StatsGrid, EmptyState } from '../components/layout/Layout';
import { Card, Button, AnimatedCounter, Badge } from '../components/ui/DesignSystem';
import { optimizedApiService } from '../services/optimizedApiService';
import { DashboardStats, InsurancePolicy, RedFlag } from '../types/api';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { DashboardSkeleton } from '../components/common/SkeletonLoaders';
import { useRetry } from '../hooks/useRetry';
import { parseApiError, getErrorMessage } from '../utils/errorHandling';
import CategorizationSummaryCard from '../components/dashboard/CategorizationSummaryCard';
import CategorizationAnalyticsChart from '../components/dashboard/CategorizationAnalyticsChart';
import CategorizationQuickActions from '../components/dashboard/CategorizationQuickActions';
import {
  DocumentTextIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Memoized Components for Performance Optimization

const DashboardStats = React.memo(({ stats }: { stats: DashboardStats | null }) => {
  const enhancedStats = useMemo(() => {
    if (!stats) return [];

    return [
      {
        name: 'Total Policies',
        value: stats.total_policies || 0,
        change: '+12% from last month',
        changeType: 'increase' as const,
        icon: DocumentTextIcon,
      },
      {
        name: 'Documents Processed',
        value: stats.total_documents || 0,
        change: '+8% from last month',
        changeType: 'increase' as const,
        icon: FolderIcon,
      },
      {
        name: 'Red Flags Detected',
        value: stats.red_flags_summary?.total || 0,
        change: '-5% from last month',
        changeType: 'decrease' as const,
        icon: ExclamationTriangleIcon,
      },
      {
        name: 'Active Policies',
        value: stats.total_policies || 0,
        change: '+15% from last month',
        changeType: 'increase' as const,
        icon: CurrencyDollarIcon,
      },
    ];
  }, [stats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-8"
    >
      <StatsGrid stats={enhancedStats} />
    </motion.div>
  );
});

DashboardStats.displayName = 'DashboardStats';

const RecentRedFlags = React.memo(({ redFlags }: { redFlags: RedFlag[] }) => {
  const getSeverityColor = useCallback((severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      case 'critical': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  }, []);

  if (!redFlags || redFlags.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">Recent Red Flags</h2>
        </div>
        <Link href="/policies">
          <Button variant="ghost" size="sm">
            View All Policies
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {redFlags.map((flag) => (
          <motion.div
            key={flag.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`border rounded-lg p-3 ${getSeverityColor(flag.severity)}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-gray-900">{flag.title}</h3>
              <Badge variant={flag.severity === 'high' ? 'destructive' : 'secondary'}>
                {flag.severity}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{flag.description}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
});

RecentRedFlags.displayName = 'RecentRedFlags';

const RecentPolicies = React.memo(({ policies }: { policies: InsurancePolicy[] }) => {
  if (!policies || policies.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Policies</h2>
        <Link href="/policies">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {policies.map((policy) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{policy.policy_name}</h3>
                <p className="text-sm text-gray-600 capitalize">{policy.policy_type}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Link href={`/policies/${policy.id}`}>
                  <Button variant="ghost" size="sm">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
});

RecentPolicies.displayName = 'RecentPolicies';

const QuickActions = React.memo(() => {
  const router = useRouter();

  const handleUploadDocument = useCallback(() => {
    router.push('/documents/upload');
  }, [router]);

  const handleAddPolicy = useCallback(() => {
    router.push('/policies/new');
  }, [router]);

  const handleViewAnalytics = useCallback(() => {
    router.push('/analytics');
  }, [router]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <Button
          variant="primary"
          className="w-full justify-start"
          onClick={handleUploadDocument}
          aria-label="Upload new insurance document"
          title="Upload a new insurance policy document"
        >
          <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          Upload Document
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleAddPolicy}
          aria-label="Add new insurance policy"
          title="Create a new insurance policy manually"
        >
          <DocumentTextIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Policy
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleViewAnalytics}
          aria-label="View analytics dashboard"
          title="View detailed analytics and reports"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          View Analytics
        </Button>
      </div>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Use optimized API with retry mechanism
  const [retryState, retryActions, dashboardData] = useRetry(
    async () => {
      const data = await optimizedApiService.getDashboardComplete();
      return data;
    },
    {
      maxRetries: 3,
      delay: 1000,
      onRetry: (attempt, error) => {
        console.log(`Dashboard load retry attempt ${attempt}:`, error.message);
      },
      onMaxRetriesReached: (error) => {
        console.error('Dashboard load failed after max retries:', error);
      }
    }
  );

  // Extract data from the optimized response
  const dashboardStats = useMemo(() => {
    if (!dashboardData?.summary) return null;
    return dashboardData.summary;
  }, [dashboardData]);

  const recentPoliciesData = useMemo(() => {
    return dashboardData?.recent_policies || [];
  }, [dashboardData]);

  // Load data on component mount
  useEffect(() => {
    retryActions.execute();
  }, []); // Empty dependency array - only run on mount

  // Memoized error message
  const errorMessage = useMemo(() => {
    if (!retryState.error) return null;
    const parsedError = parseApiError(retryState.error);
    return getErrorMessage(parsedError);
  }, [retryState.error]);

  // Memoized utility functions to prevent re-creation on every render
  const formatCurrency = useCallback((amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Memoized recent red flags to prevent unnecessary re-renders
  const recentRedFlags = useMemo(() => {
    return dashboardStats?.recent_red_flags || [];
  }, [dashboardStats?.recent_red_flags]);

  if (retryState.isLoading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Dashboard - InsureAI Platform</title>
          <meta name="description" content="Your insurance policy analysis dashboard" />
        </Head>
        <Layout showNavigation={true}>
          <DashboardSkeleton />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (retryState.error && !retryState.canRetry) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Dashboard - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <EmptyState
            title="Error Loading Dashboard"
            description={errorMessage || 'Failed to load dashboard data'}
            action={{
              label: "Try Again",
              onClick: retryActions.retry
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
        <title>Dashboard - InsureAI Platform</title>
        <meta name="description" content="Your insurance policy analysis dashboard with AI-powered insights" />
      </Head>
      <Layout showNavigation={true}>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Dashboard Error Boundary caught error:', error, errorInfo);
          }}
          resetKeys={[user?.id, dashboardData]}
        >
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Welcome back, {user?.first_name || 'User'}! 👋
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Here's what's happening with your insurance policies today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/documents/upload')}
                className="flex items-center space-x-2"
                aria-label="Upload new insurance document"
                title="Upload a new insurance policy document"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                <span>Upload Document</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/policies/new')}
                className="flex items-center space-x-2"
                aria-label="Add new insurance policy"
                title="Create a new insurance policy manually"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                <span>Add Policy</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Optimized Stats Grid - Memoized Component */}
        <DashboardStats stats={dashboardStats} />

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Insights - Memoized Component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex items-center space-x-2 mb-4">
                  <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Your policies have <strong>95% coverage</strong> for essential benefits.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Consider reviewing <strong>dental coverage</strong> limits for better protection.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Potential savings of <strong>$2,400/year</strong> identified across policies.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Categorization Summary */}
            {dashboardStats?.categorization_summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <CategorizationSummaryCard
                  categorizationSummary={dashboardStats.categorization_summary}
                />
              </motion.div>
            )}

            {/* Categorization Analytics */}
            {dashboardStats?.categorization_summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <CategorizationAnalyticsChart
                  categorizationSummary={dashboardStats.categorization_summary}
                />
              </motion.div>
            )}

            {/* Recent Red Flags - Memoized Component */}
            <RecentRedFlags redFlags={recentRedFlags} />
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            {/* Categorization Quick Actions */}
            {dashboardStats?.categorization_summary ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <CategorizationQuickActions
                  categorizationSummary={dashboardStats.categorization_summary}
                  onAutoCategorize={async () => {
                    // TODO: Implement auto-categorization for all policies
                    console.log('Auto-categorizing all policies...');
                  }}
                  onRefreshData={async () => {
                    retryActions.retry();
                  }}
                  onExportReport={async () => {
                    // TODO: Implement export functionality
                    console.log('Exporting categorization report...');
                  }}
                  onViewFiltered={(filter) => {
                    // TODO: Navigate to filtered view
                    console.log('Viewing filtered data:', filter);
                    router.push(`/policies?filter=${filter}`);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <QuickActions />
              </motion.div>
            )}

            {/* Recent Policies - Memoized Component */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <RecentPolicies policies={recentPoliciesData} />
            </motion.div>
          </div>
        </div>
        </ErrorBoundary>
      </Layout>
    </ProtectedRoute>
  );
}
