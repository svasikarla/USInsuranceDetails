import React from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Layout } from '../../components/layout/Layout';

export default function AnalyticsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Head>
        <title>Analytics - InsureAI Platform</title>
        <meta name="description" content="Analytics page" />
      </Head>
      <Layout showNavigation={true}>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics & Insights</h1>
          <p className="text-gray-600 mb-8">Minimal analytics page for debugging</p>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-center text-gray-500">Analytics page loaded successfully!</p>
            <p className="text-center text-sm text-gray-400 mt-2">User: {user?.email || 'Not logged in'}</p>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}