import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'destructive' | 'blue' | 'orange' | 'teal' | 'red' | 'yellow' | 'green' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors';
  
  const variants = {
    primary: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
    blue: 'bg-blue-100 text-blue-800 border border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border border-orange-200',
    teal: 'bg-teal-100 text-teal-800 border border-teal-200',
    red: 'bg-red-100 text-red-800 border border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    green: 'bg-green-100 text-green-800 border border-green-200',
    gray: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
