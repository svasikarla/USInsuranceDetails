import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { carrierApi } from '../../../services/apiService';
import { InsuranceCarrier, InsuranceCarrierUpdate } from '../../../types/api';

export default function EditCarrierPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [carrier, setCarrier] = useState<InsuranceCarrier | null>(null);
  const [formData, setFormData] = useState<InsuranceCarrierUpdate>({
    name: '',
    code: '',
    api_endpoint: '',
    api_auth_method: '',
    api_key_name: '',
    logo_url: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadCarrier(id);
    }
  }, [id]);

  const loadCarrier = async (carrierId: string) => {
    try {
      setLoading(true);
      const carrierData = await carrierApi.getCarrier(carrierId);
      setCarrier(carrierData);
      
      // Populate form with current data
      setFormData({
        name: carrierData.name,
        code: carrierData.code,
        api_endpoint: carrierData.api_endpoint || '',
        api_auth_method: carrierData.api_auth_method || '',
        api_key_name: carrierData.api_key_name || '',
        logo_url: carrierData.logo_url || '',
        is_active: carrierData.is_active
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading carrier:', err);
      if (err.response?.status === 404) {
        setError('Carrier not found');
      } else {
        setError('Failed to load carrier');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.name?.trim()) {
      errors.name = 'Carrier name is required';
    }

    if (!formData.code?.trim()) {
      errors.code = 'Carrier code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      errors.code = 'Carrier code must contain only uppercase letters, numbers, and underscores';
    }

    // URL validation
    if (formData.api_endpoint && !isValidUrl(formData.api_endpoint)) {
      errors.api_endpoint = 'Please enter a valid URL';
    }

    if (formData.logo_url && !isValidUrl(formData.logo_url)) {
      errors.logo_url = 'Please enter a valid URL';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setFormData(prev => ({
      ...prev,
      code: value
    }));

    if (validationErrors.code) {
      setValidationErrors(prev => ({
        ...prev,
        code: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !carrier) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Clean up form data - remove empty strings and unchanged values
      const cleanedData: InsuranceCarrierUpdate = {};
      
      if (formData.name?.trim() !== carrier.name) {
        cleanedData.name = formData.name.trim();
      }
      if (formData.code?.trim() !== carrier.code) {
        cleanedData.code = formData.code.trim();
      }
      if ((formData.api_endpoint?.trim() || '') !== (carrier.api_endpoint || '')) {
        cleanedData.api_endpoint = formData.api_endpoint?.trim() || undefined;
      }
      if ((formData.api_auth_method?.trim() || '') !== (carrier.api_auth_method || '')) {
        cleanedData.api_auth_method = formData.api_auth_method?.trim() || undefined;
      }
      if ((formData.api_key_name?.trim() || '') !== (carrier.api_key_name || '')) {
        cleanedData.api_key_name = formData.api_key_name?.trim() || undefined;
      }
      if ((formData.logo_url?.trim() || '') !== (carrier.logo_url || '')) {
        cleanedData.logo_url = formData.logo_url?.trim() || undefined;
      }
      if (formData.is_active !== carrier.is_active) {
        cleanedData.is_active = formData.is_active;
      }

      // Only update if there are changes
      if (Object.keys(cleanedData).length === 0) {
        router.push(`/carriers/${carrier.id}`);
        return;
      }

      const updatedCarrier = await carrierApi.updateCarrier(carrier.id, cleanedData);
      
      // Redirect to carrier detail page
      router.push(`/carriers/${updatedCarrier.id}`);
    } catch (err: any) {
      console.error('Error updating carrier:', err);
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('already exists')) {
        setValidationErrors({ code: 'A carrier with this code already exists' });
      } else {
        setError(err.response?.data?.detail || 'Failed to update carrier');
      }
    } finally {
      setSaving(false);
    }
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
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <Link href="/carriers" className="hover:text-gray-700">Carriers</Link>
                  <span>/</span>
                  <Link href={`/carriers/${carrier.id}`} className="hover:text-gray-700">{carrier.name}</Link>
                  <span>/</span>
                  <span>Edit</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Carrier</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Update carrier information and settings
                </p>
              </div>
              <Link
                href={`/carriers/${carrier.id}`}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Carrier
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600">
                  Update the basic details for the insurance carrier
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carrier Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Blue Cross Blue Shield"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carrier Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleCodeChange}
                      placeholder="e.g., BCBS"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                        validationErrors.code ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Uppercase letters, numbers, and underscores only
                    </p>
                    {validationErrors.code && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.logo_url ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.logo_url && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.logo_url}</p>
                  )}
                  {formData.logo_url && isValidUrl(formData.logo_url) && (
                    <div className="mt-2">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo preview"
                        className="h-12 w-12 rounded-md object-contain border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active carrier</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Inactive carriers will not appear in selection lists
                  </p>
                </div>
              </div>
            </div>

            {/* API Integration */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">API Integration</h3>
                <p className="text-sm text-gray-600">
                  Configure API integration settings (optional)
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    name="api_endpoint"
                    value={formData.api_endpoint}
                    onChange={handleInputChange}
                    placeholder="https://api.carrier.com/v1"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.api_endpoint ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.api_endpoint && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.api_endpoint}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Authentication Method
                    </label>
                    <select
                      name="api_auth_method"
                      value={formData.api_auth_method}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select method...</option>
                      <option value="api_key">API Key</option>
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="basic_auth">Basic Authentication</option>
                      <option value="bearer_token">Bearer Token</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key Name
                    </label>
                    <input
                      type="text"
                      name="api_key_name"
                      value={formData.api_key_name}
                      onChange={handleInputChange}
                      placeholder="e.g., X-API-Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Header name for API key authentication
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Link
                href={`/carriers/${carrier.id}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
