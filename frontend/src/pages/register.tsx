import React from 'react';
import Head from 'next/head';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

const RegisterPage: React.FC = () => {
  return (
    <ProtectedRoute requireAuth={false}>
      <Head>
        <title>Create Account - InsureAI Platform</title>
        <meta name="description" content="Create your InsureAI account and start analyzing insurance policies with AI-powered insights" />
      </Head>
      <RegisterForm />
    </ProtectedRoute>
  );
};

export default RegisterPage;
