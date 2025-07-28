import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// Enhanced Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  title
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl hover:scale-105',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-lg hover:shadow-xl hover:scale-105',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl hover:scale-105'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      aria-label={ariaLabel}
      title={title}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

// Enhanced Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  gradient = false,
  onClick
}) => {
  const baseClasses = 'bg-white rounded-2xl shadow-lg transition-all duration-300';
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white to-gray-50' : '';

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Input Component
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  icon: Icon,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  required = false
}) => {
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          id={inputId}
          name={name || inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel || label}
          aria-describedby={ariaDescribedBy || errorId}
          aria-invalid={error ? 'true' : 'false'}
          className={`
            block w-full rounded-xl border-2 transition-all duration-200
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-offset-2
            placeholder-gray-400 text-gray-900
          `}
        />
      </div>
      {error && (
        <motion.p
          id={errorId}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Loading Skeleton Component
interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded-lg ${index > 0 ? 'mt-2' : ''}`}
          style={{ height: '1rem' }}
        />
      ))}
    </div>
  );
};

// Enhanced Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const variants = {
    primary: 'bg-indigo-100 text-indigo-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

// Animated Counter Component
interface CounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<CounterProps> = ({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  const [count, setCount] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    const startCount = 0;
    
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = Math.floor(progress * (value - startCount) + startCount);
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [value, duration, isVisible]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ 
        opacity: 1,
        transition: { 
          duration: 0.5,
          onComplete: () => setIsVisible(true)
        }
      }}
      viewport={{ once: true }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
};
