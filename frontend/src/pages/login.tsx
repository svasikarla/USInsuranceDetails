import React from 'react';
import Head from 'next/head';
import { LoginForm } from '../components/auth/LoginForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

const LoginPage: React.FC = () => {
  return (
    <ProtectedRoute requireAuth={false}>
      <Head>
        <title>Sign In - InsureAI Platform</title>
        <meta name="description" content="Sign in to your InsureAI account to access AI-powered insurance policy analysis" />
      </Head>
      <LoginForm />
    </ProtectedRoute>
  );
};

export default LoginPage;
