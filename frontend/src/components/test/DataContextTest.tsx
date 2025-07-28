import React from 'react';
import { useSimpleData } from '../../contexts/DataContextSimple';
import { useUI } from '../../contexts/UIContext';

// ============================================================================
// TEST COMPONENT FOR DATA CONTEXT
// ============================================================================

export const DataContextTest: React.FC = () => {
  const dataContext = useSimpleData();
  const uiContext = useUI();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Data Context Test Page
          </h1>
          <p className="text-gray-600">
            This page tests the new DataContext, UIContext, and optimized hooks implementation.
          </p>
        </div>

        {/* Data Context Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Simple Data Context Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Loading States</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Dashboard: {dataContext.state.loading.dashboard ? '✅ Loading' : '❌ Not Loading'}</li>
                <li>Policies: {dataContext.state.loading.policies ? '✅ Loading' : '❌ Not Loading'}</li>
                <li>Documents: {dataContext.state.loading.documents ? '✅ Loading' : '❌ Not Loading'}</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Data Status</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Policies Count: {dataContext.state.policies.length}</li>
                <li>Documents Count: {dataContext.state.documents.length}</li>
                <li>Carriers Count: {dataContext.state.carriers.length}</li>
              </ul>
            </div>
          </div>

          {/* Error States */}
          {(dataContext.state.errors.dashboard ||
            dataContext.state.errors.policies ||
            dataContext.state.errors.documents) && (
            <div className="mt-4 bg-red-50 rounded p-4">
              <h3 className="font-medium text-red-900 mb-2">Errors</h3>
              <ul className="text-sm text-red-600 space-y-1">
                {dataContext.state.errors.dashboard && (
                  <li>Dashboard: {dataContext.state.errors.dashboard}</li>
                )}
                {dataContext.state.errors.policies && (
                  <li>Policies: {dataContext.state.errors.policies}</li>
                )}
                {dataContext.state.errors.documents && (
                  <li>Documents: {dataContext.state.errors.documents}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* UI Context Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            UI Context Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Page Loading States</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Dashboard: {uiContext.state.pageLoading.dashboard ? '✅ Loading' : '❌ Not Loading'}</li>
                <li>Policies: {uiContext.state.pageLoading.policies ? '✅ Loading' : '❌ Not Loading'}</li>
                <li>Documents: {uiContext.state.pageLoading.documents ? '✅ Loading' : '❌ Not Loading'}</li>
                <li>Analytics: {uiContext.state.pageLoading.analytics ? '✅ Loading' : '❌ Not Loading'}</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Navigation States</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Mobile Menu: {uiContext.state.navigation.mobileMenuOpen ? '✅ Open' : '❌ Closed'}</li>
                <li>Profile Menu: {uiContext.state.navigation.profileMenuOpen ? '✅ Open' : '❌ Closed'}</li>
                <li>Sidebar: {uiContext.state.navigation.sidebarOpen ? '✅ Open' : '❌ Closed'}</li>
              </ul>
            </div>
          </div>

          {/* Notifications */}
          {uiContext.state.notifications.length > 0 && (
            <div className="mt-4 bg-blue-50 rounded p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Notifications ({uiContext.state.notifications.length})
              </h3>
              <div className="space-y-2">
                {uiContext.state.notifications.map(notification => (
                  <div key={notification.id} className="text-sm text-blue-600">
                    <span className="font-medium">{notification.type}:</span> {notification.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Simple Data Operations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Operations Test
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Sample Data</h3>
              <p className="text-sm text-gray-600 mb-3">
                Test the data context by adding sample data
              </p>
              <button
                onClick={() => {
                  dataContext.setPolicies([
                    {
                      id: '1',
                      policy_number: 'TEST-001',
                      policy_type: 'health',
                      carrier_name: 'Test Insurance',
                      status: 'active',
                      effective_date: new Date().toISOString(),
                      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                      premium_amount: 500,
                      deductible_amount: 1000,
                      coverage_details: {},
                      user_id: 'test-user',
                      document_id: 'test-doc',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }
                  ]);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add Sample Policy
              </button>
            </div>

            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-medium text-gray-900 mb-2">Loading States</h3>
              <p className="text-sm text-gray-600 mb-3">
                Test loading state management
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => dataContext.setLoading('dashboard', true)}
                  className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Set Loading
                </button>
                <button
                  onClick={() => dataContext.setLoading('dashboard', false)}
                  className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Clear Loading
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test Actions
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => uiContext.addNotification({
                type: 'info',
                title: 'Test Notification',
                message: 'This is a test notification from the DataContext test page.',
                autoClose: true,
                duration: 3000,
              })}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Test Notification
            </button>

            <button
              onClick={() => uiContext.clearNotifications()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Notifications
            </button>

            <button
              onClick={() => dataContext.clearErrors()}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Clear All Errors
            </button>

            <button
              onClick={() => dataContext.setError('dashboard', 'Test error message')}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Add Test Error
            </button>
          </div>
        </div>

        {/* Raw Data Display */}
        {dataContext.state.policies.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sample Policy Data
            </h2>
            <pre className="bg-gray-100 rounded p-4 text-xs overflow-auto max-h-96">
              {JSON.stringify(dataContext.state.policies[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
