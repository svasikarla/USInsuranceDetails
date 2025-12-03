import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../ui/DesignSystem';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    company_name: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Name validation
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Password confirmation validation
    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      onSuccess?.();
    } catch (error: any) {
      setSubmitError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="flex items-center space-x-2">
              <span className="text-4xl">🛡️</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InsureAI
              </span>
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Join thousands of companies using AI-powered insurance analysis
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {submitError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{submitError}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                placeholder="First name"
                value={formData.first_name}
                onChange={(value) => handleInputChange('first_name', value)}
                error={errors.first_name}
              />

              <Input
                label="Last Name"
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                placeholder="Last name"
                value={formData.last_name}
                onChange={(value) => handleInputChange('last_name', value)}
                error={errors.last_name}
              />
            </div>

            {/* Email field */}
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              error={errors.email}
            />

            {/* Company field (optional) */}
            <Input
              label="Company Name (Optional)"
              id="company_name"
              name="company_name"
              type="text"
              autoComplete="organization"
              placeholder="Company name"
              value={formData.company_name}
              onChange={(value) => handleInputChange('company_name', value)}
            />

            {/* Password fields */}
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Password (min. 8 characters)"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              id="password_confirm"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm password"
              value={formData.password_confirm}
              onChange={(value) => handleInputChange('password_confirm', value)}
              error={errors.password_confirm}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
