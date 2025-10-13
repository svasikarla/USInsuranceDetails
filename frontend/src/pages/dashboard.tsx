import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useRetry } from '../hooks/useRetry';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { Layout, PageHeader, StatsGrid, EmptyState } from '../components/layout/Layout';
import { Card, Button, AnimatedCounter, Badge } from '../components/ui/DesignSystem';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats, InsurancePolicy, RedFlag } from '../types/api';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { DashboardSkeleton } from '../components/common/SkeletonLoaders';
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

interface DashboardStatsProps {
  stats: DashboardStats | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = React.memo(({ stats }) => {
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

interface RecentRedFlagsProps {
  redFlags: RedFlag[];
}

const RecentRedFlags: React.FC<RecentRedFlagsProps> = React.memo(({ redFlags }) => {
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

interface RecentPoliciesProps {
  policies: InsurancePolicy[];
}

const RecentPolicies: React.FC<RecentPoliciesProps> = React.memo(({ policies }) => {
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

interface DashboardError extends Error {
  code?: string;
  response?: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats;
    recentPolicies: InsurancePolicy[];
    recentRedFlags: RedFlag[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);
  const [showCategorization, setShowCategorization] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.fetchDashboardDataWithRetry();
      setDashboardData(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    const parsedError = parseApiError(error);
    return getErrorMessage(parsedError);
  }, [error]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Loading... - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <DashboardSkeleton />
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !dashboardData) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Error - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <EmptyState
            title="Error Loading Dashboard"
            description={errorMessage || 'Failed to load dashboard data. Please try again.'}
            action={{
              label: "Try Again",
              onClick: loadDashboardData,
            }}
            icon={ExclamationTriangleIcon}
          />
        </Layout>
      </ProtectedRoute>
    );
  }

  const { stats, recentPolicies, recentRedFlags } = dashboardData;

  return (
    <ProtectedRoute>
      <Layout showNavigation={true}>
        <ErrorBoundary>
          <Head>
            <title>Dashboard | Insurance Platform</title>
            <meta name="description" content="Your insurance dashboard" />
          </Head>

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

            {/* Categorization Summary */}
            {showCategorization && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">Categorization Summary</h2>
                <div className="grid grid-cols-1 gap-4">
                  <CategorizationSummaryCard
                    categorizationSummary={stats?.categorization_summary as any}
                  />
                </div>
              </motion.div>
            )}

            {/* Recent Policies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <RecentPolicies policies={recentPolicies} />
            </motion.div>

          <div className="space-y-6">
            {/* Recent Red Flags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <RecentRedFlags redFlags={recentRedFlags} />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Policies</p>
                  <p className="text-2xl font-semibold">{stats.total_policies}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Policies</p>
                  <p className="text-2xl font-semibold">{stats.total_policies}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recent Red Flags</p>
                  <p className="text-2xl font-semibold">{stats.red_flags_summary.total}</p>
                </div>
              </div>
            </motion.div>
          </div>
      </ErrorBoundary>
    </Layout>
  </ProtectedRoute>
);

}

