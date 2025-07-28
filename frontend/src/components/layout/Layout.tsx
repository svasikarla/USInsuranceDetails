import React from 'react';
import { motion } from 'framer-motion';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavigation?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  showNavigation = true,
  className = ''
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {showNavigation && <Navigation />}
      
      <main className={`${showNavigation ? 'pt-0' : 'pt-16'} ${className}`}>
        {(title || description) && (
          <div className="bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {title && (
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-4 text-lg text-gray-600">
                    {description}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        )}
        
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// Page Header Component
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ name: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      {breadcrumbs && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.name} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="h-4 w-4 text-gray-400 mx-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {crumb.name}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-gray-900">
                    {crumb.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-lg text-gray-600">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Stats Grid Component
interface StatItem {
  name: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

interface StatsGridProps {
  stats: StatItem[];
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center">
            {stat.icon && (
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
            <div className={stat.icon ? 'ml-4' : ''}>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change && (
                <p className={`text-sm ${
                  stat.changeType === 'increase' ? 'text-green-600' :
                  stat.changeType === 'decrease' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon: Icon
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="text-center py-12"
    >
      {Icon && (
        <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
          <Icon className="h-full w-full" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <motion.button
          onClick={action.onClick}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};
