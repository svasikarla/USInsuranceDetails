import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { carrierApi, policyApi, documentApi } from '../../services/apiService';
import { InsuranceCarrier, CarrierStats, InsurancePolicy, PolicyDocument } from '../../types/api';

export default function CarrierDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [carrier, setCarrier] = useState<InsuranceCarrier | null>(null);
  const [stats, setStats] = useState<CarrierStats | null>(null);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'documents'>('overview');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadCarrierData(id);
    }
  }, [id]);

  const loadCarrierData = async (carrierId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load carrier details
      const carrierData = await carrierApi.getCarrier(carrierId);
      setCarrier(carrierData);

      // Load carrier statistics
      const statsData = await carrierApi.getCarrierStats(carrierId);
      setStats(statsData);

      // Load related policies and documents
      const [policiesData, documentsData] = await Promise.all([
        policyApi.getPolicies({ carrier_id: carrierId }),
        documentApi.getDocuments({ carrier_id: carrierId })
      ]);
      
      setPolicies(policiesData);
      setDocuments(documentsData);
    } catch (err: any) {
      console.error('Error loading carrier data:', err);
      if (err.response?.status === 404) {
        setError('Carrier not found');
      } else {
        setError('Failed to load carrier data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!carrier) return;

    const newStatus = !carrier.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this carrier?`)) {
      return;
    }

    try {
      const updatedCarrier = await carrierApi.updateCarrier(carrier.id, {
        is_active: newStatus
      });
      setCarrier(updatedCarrier);
    } catch (err) {
      console.error('Error updating carrier status:', err);
      setError('Failed to update carrier status');
    }
  };

  const handleDelete = async () => {
    if (!carrier) return;

    if (!confirm('Are you sure you want to delete this carrier? This action cannot be undone.')) {
      return;
    }

    try {
      await carrierApi.deleteCarrier(carrier.id);
      router.push('/carriers');
    } catch (err) {
      console.error('Error deleting carrier:', err);
      setError('Failed to delete carrier');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? '✅' : '❌';
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !carrier) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Carrier not found'}
            </h2>
            <Link
              href="/carriers"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Carriers
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
              <div className="flex items-center space-x-4">
                {carrier.logo_url ? (
                  <img 
                    src={carrier.logo_url} 
                    alt={carrier.name}
                    className="h-16 w-16 rounded-lg object-contain border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xl font-bold">
                      {carrier.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                    <Link href="/carriers" className="hover:text-gray-700">Carriers</Link>
                    <span>/</span>
                    <span>{carrier.name}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{carrier.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-600 font-mono">Code: {carrier.code}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(carrier.is_active)}`}>
                      <span className="mr-1">{getStatusIcon(carrier.is_active)}</span>
                      {carrier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleStatusToggle}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    carrier.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {carrier.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <Link
                  href={`/carriers/${carrier.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
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

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{stats.total_policies}</div>
                <div className="text-sm text-gray-600">Total Policies</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{stats.active_policies}</div>
                <div className="text-sm text-gray-600">Active Policies</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{stats.total_documents}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">{stats.recent_activity}</div>
                <div className="text-sm text-gray-600">Recent Activity</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('policies')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'policies'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Policies ({policies.length})
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'documents'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Documents ({documents.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{carrier.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Code</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{carrier.code}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <p className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(carrier.is_active)}`}>
                            <span className="mr-1">{getStatusIcon(carrier.is_active)}</span>
                            {carrier.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(carrier.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* API Integration */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">API Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">API Endpoint</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {carrier.api_endpoint || (
                            <span className="text-gray-400 italic">Not configured</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Authentication Method</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {carrier.api_auth_method || (
                            <span className="text-gray-400 italic">Not configured</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">API Key Name</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {carrier.api_key_name || (
                            <span className="text-gray-400 italic">Not configured</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Integration Status</label>
                        <p className="mt-1">
                          {carrier.api_endpoint ? (
                            <span className="text-green-600 text-sm">✓ Configured</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not configured</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'policies' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Associated Policies</h3>
                    <Link
                      href={`/policies/new?carrier_id=${carrier.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Add Policy
                    </Link>
                  </div>
                  
                  {policies.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📋</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No policies found</h4>
                      <p className="text-gray-600 mb-4">
                        This carrier doesn't have any associated policies yet.
                      </p>
                      <Link
                        href={`/policies/new?carrier_id=${carrier.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Create First Policy
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Policy
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Effective Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {policies.map((policy) => (
                            <tr key={policy.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {policy.policy_name}
                                </div>
                                {policy.policy_number && (
                                  <div className="text-sm text-gray-500 font-mono">
                                    {policy.policy_number}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {policy.policy_type || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {policy.effective_date 
                                  ? new Date(policy.effective_date).toLocaleDateString()
                                  : 'N/A'
                                }
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">
                                <Link
                                  href={`/policies/${policy.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Associated Documents</h3>
                    <Link
                      href={`/documents/upload?carrier_id=${carrier.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Upload Document
                    </Link>
                  </div>
                  
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📄</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No documents found</h4>
                      <p className="text-gray-600 mb-4">
                        This carrier doesn't have any associated documents yet.
                      </p>
                      <Link
                        href={`/documents/upload?carrier_id=${carrier.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Upload First Document
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Document
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Uploaded
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {documents.map((document) => (
                            <tr key={document.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {document.original_filename}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {(document.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  document.processing_status === 'completed' ? 'bg-green-100 text-green-800' :
                                  document.processing_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                  document.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {document.processing_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {formatDate(document.created_at)}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">
                                <Link
                                  href={`/documents/${document.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
