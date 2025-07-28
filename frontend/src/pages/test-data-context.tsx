import React from 'react';
import Head from 'next/head';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { DataContextTest } from '../components/test/DataContextTest';

export default function TestDataContextPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Data Context Test - InsureAI Platform</title>
        <meta name="description" content="Test page for the new DataContext implementation" />
      </Head>
      <DataContextTest />
    </ProtectedRoute>
  );
}
