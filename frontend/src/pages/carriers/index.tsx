import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Layout, PageHeader, EmptyState } from '../../components/layout/Layout';
import { Card, Button, Badge, Input } from '../../components/ui/DesignSystem';
import { carrierApi } from '../../services/apiService';
import { InsuranceCarrier, CarrierFilters } from '../../types/api';
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function CarriersPage() {
  const router = useRouter();
  const [carriers, setCarriers] = useState<InsuranceCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<CarrierFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCarriers();
  }, []);

  useEffect(() => {
    const newFilters: CarrierFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (statusFilter === 'active') newFilters.is_active = true;
    if (statusFilter === 'inactive') newFilters.is_active = false;
    
    setFilters(newFilters);
    loadCarriers(newFilters);
  }, [searchTerm, statusFilter]);

  const loadCarriers = async (filters?: CarrierFilters) => {
    try {
      setLoading(true);
      const carriersData = await carrierApi.getCarriers(filters);
      setCarriers(carriersData);
      setError(null);
    } catch (err) {
      console.error('Error loading carriers:', err);
      setError('Failed to load carriers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCarrierSelect = (carrierId: string) => {
    setSelectedCarriers(prev => 
      prev.includes(carrierId) 
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedCarriers.length === 0) return;
    
    try {
      await Promise.all(
        selectedCarriers.map(id => carrierApi.deleteCarrier(id))
      );
      setSelectedCarriers([]);
      loadCarriers();
    } catch (err) {
      console.error('Error deleting carriers:', err);
    }
  };

  const toggleCarrierStatus = async (carrierId: string, currentStatus: boolean) => {
    try {
      await carrierApi.updateCarrier(carrierId, { is_active: !currentStatus });
      loadCarriers();
    } catch (err) {
      console.error('Error updating carrier status:', err);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Head>
          <title>Insurance Carriers - InsureAI Platform</title>
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
          <title>Insurance Carriers - InsureAI Platform</title>
        </Head>
        <Layout showNavigation={true}>
          <EmptyState
            title="Error Loading Carriers"
            description={error}
            action={{
              label: "Try Again",
              onClick: () => loadCarriers()
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
        <title>Insurance Carriers - InsureAI Platform</title>
        <meta name="description" content="Manage insurance carriers and their integration settings" />
      </Head>
      <Layout showNavigation={true}>
        <PageHeader
          title="Insurance Carriers"
          description="Manage insurance carriers, their API integrations, and system settings"
          actions={
            <div className="flex items-center space-x-3">
              {selectedCarriers.length > 0 && (
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete ({selectedCarriers.length})</span>
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
                onClick={() => router.push('/carriers/new')}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Carrier</span>
              </Button>
            </div>
          }
        />

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search carriers..."
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
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="code-asc">Code A-Z</option>
                    <option value="code-desc">Code Z-A</option>
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Carriers Grid */}
        {carriers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map((carrier, index) => (
              <motion.div
                key={carrier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card hover className="p-6 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCarriers.includes(carrier.id)}
                        onChange={() => handleCarrierSelect(carrier.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={carrier.is_active ? 'success' : 'secondary'}>
                            {carrier.is_active ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {carrier.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">
                          {carrier.code}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {carrier.api_endpoint && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <GlobeAltIcon className="h-4 w-4" />
                        <span className="truncate">API Integration</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(carrier.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Updated</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(carrier.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/carriers/${carrier.id}`)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/carriers/${carrier.id}/edit`)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant={carrier.is_active ? "outline" : "primary"}
                      size="sm"
                      onClick={() => toggleCarrierStatus(carrier.id, carrier.is_active)}
                    >
                      {carrier.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Carriers Found"
            description="Start by adding your first insurance carrier to manage policies and integrations."
            action={{
              label: "Add Your First Carrier",
              onClick: () => router.push('/carriers/new')
            }}
            icon={BuildingOfficeIcon}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}
